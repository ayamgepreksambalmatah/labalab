-- ============================================================
-- LabaLab — Trigger sync stok v2 (perbaikan untuk fitur Edit Transaksi).
-- Versi 0015 hanya menangani perubahan STATUS. Versi ini pakai selisih
-- "efek pengurangan" old vs new, jadi perubahan QTY (walau status tetap
-- 'selesai') dan perpindahan product_id ikut menyesuaikan stok dengan benar.
-- Jalankan sekali di Supabase SQL Editor. Idempotent (create or replace).
-- ============================================================

create or replace function public.sync_stock_on_transaction()
returns trigger as $$
declare
  old_eff integer := 0; -- unit yang tadinya mengurangi stok
  new_eff integer := 0; -- unit yang seharusnya mengurangi stok sekarang
begin
  if (TG_OP = 'INSERT') then
    if new.product_id is not null and (new.status = 'selesai' or new.status is null) then
      update public.products
      set stok = greatest(0, coalesce(stok, 0) - new.qty)
      where id = new.product_id;
    end if;
    return new;
  end if;

  if (TG_OP = 'UPDATE') then
    old_eff := case
      when old.product_id is not null and (old.status = 'selesai' or old.status is null)
      then old.qty else 0 end;
    new_eff := case
      when new.product_id is not null and (new.status = 'selesai' or new.status is null)
      then new.qty else 0 end;

    if old.product_id is not distinct from new.product_id then
      -- Produk sama: sesuaikan selisih efek (kembalikan old, kurangi new).
      if new.product_id is not null and (new_eff - old_eff) <> 0 then
        update public.products
        set stok = greatest(0, coalesce(stok, 0) - (new_eff - old_eff))
        where id = new.product_id;
      end if;
    else
      -- Produk berpindah: kembalikan ke produk lama, kurangi dari produk baru.
      if old.product_id is not null and old_eff <> 0 then
        update public.products set stok = coalesce(stok, 0) + old_eff where id = old.product_id;
      end if;
      if new.product_id is not null and new_eff <> 0 then
        update public.products set stok = greatest(0, coalesce(stok, 0) - new_eff) where id = new.product_id;
      end if;
    end if;
    return new;
  end if;

  if (TG_OP = 'DELETE') then
    if old.product_id is not null and (old.status = 'selesai' or old.status is null) then
      update public.products set stok = coalesce(stok, 0) + old.qty where id = old.product_id;
    end if;
    return old;
  end if;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sync_stock on public.sales_transactions;
create trigger trg_sync_stock
  after insert or update or delete on public.sales_transactions
  for each row execute function public.sync_stock_on_transaction();
