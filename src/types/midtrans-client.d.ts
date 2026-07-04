declare module "midtrans-client" {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }
  interface SnapTransaction {
    token: string;
    redirect_url: string;
  }
  class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: Record<string, unknown>): Promise<SnapTransaction>;
  }
  class CoreApi {
    constructor(config: SnapConfig);
  }
  const midtransClient: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default midtransClient;
}
