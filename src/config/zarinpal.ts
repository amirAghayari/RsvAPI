export const ZARINPAL = {
  sandbox: process.env.ZARINPAL_SANDBOX === "true",

  merchantId: process.env.ZARINPAL_MERCHANT_ID!,

  callbackUrl: process.env.ZARINPAL_CALLBACK_URL!,
};
