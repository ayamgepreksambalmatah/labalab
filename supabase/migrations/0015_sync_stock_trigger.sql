-- ============================================================
-- LabaLab — Auto-sinkron stok saat ada penjualan.
-- products.stok berkurang otomatis saat sales_transactions 'selesai'
-- (atau null) di-INSERT, dan kembali saat dibatalkan/dihapus.
--
-- Asumsi: transaksi upload Excel dianggap 'selesai'. Input manual WAJIB
-- set status eksplisit ('selesai'/'pending') — kode app sudah menjamin ini.
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

create or replace function public.sync_stock_on_transaction()
returns trigger as $$
begin
  -- INSERT baru dengan status 'selesai' (atau null) → kurangi stok
  if (TG_OP = 'INSERT') then
    if new.product_id is not null and (new.status = 'selesai' or new.status is null) then
      update public.products
      set stok = greatest(0, coalesce(stok, 0) - new.qty)
      where id = new.product_id;
    end if;
    return new;
  end if;

  -- UPDATE: kalau status berubah dari/ke 'selesai', sesuaikan stok
  if (TG_OP = 'UPDATE') then
    -- Sebelumnya 'selesai', sekarang bukan → kembalikan stok
    if (old.status = 'selesai' or old.status is null) and new.status not in ('selesai') and new.status is not null then
      update public.products set stok = coalesce(stok, 0) + old.qty where id = old.product_id;
    -- Sebelumnya bukan 'selesai', sekarang jadi 'selesai' → kurangi stok
    elsif new.status = 'selesai' and old.status not in ('selesai') and old.status is not null then
      update public.products set stok = greatest(0, coalesce(stok, 0) - new.qty) where id = new.product_id;
    end if;
    return new;
  end if;

  -- DELETE: kalau transaksi yang sudah 'selesai' dihapus, kembalikan stok
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
