import axios from "axios";
import { ZARINPAL } from "../../../../config/zarinpal";
import {
  RequestPaymentInput,
  RequestPaymentOutput,
  VerifyPaymentInput,
  VerifyPaymentOutput,
} from "../zarinpal.types";
import { BadRequestError } from "../../../../errors/bad-request-error";

export class ZarinpalService {
  private readonly baseUrl = ZARINPAL.sandbox
    ? "https://sandbox.zarinpal.com/pg/v4/payment"
    : "https://payment.zarinpal.com/pg/v4/payment";

  async requestPayment(
    input: RequestPaymentInput,
  ): Promise<RequestPaymentOutput> {
    const response = await axios.post(
      `${this.baseUrl}/request.json`,
      {
        merchant_id: ZARINPAL.merchantId,

        amount: input.amount,

        callback_url: `${ZARINPAL.callbackUrl}?paymentId=${input.paymentId}`,

        description: input.description,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data.data;

    if (response.data.errors) {
      throw new BadRequestError(
        response.data.errors.message ?? "Zarinpal request failed.",
      );
    }

    return {
      authority: data.authority,

      paymentUrl: `https://www.zarinpal.com/pg/StartPay/${data.authority}`,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentOutput> {
    const response = await axios.post(
      `${this.baseUrl}/verify.json`,
      {
        merchant_id: ZARINPAL.merchantId,

        amount: input.amount,

        authority: input.authority,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.errors) {
      return {
        success: false,
      };
    }

    const data = response.data.data;

    return {
      success: true,

      refId: data.ref_id?.toString(),

      cardPan: data.card_pan,

      fee: data.fee,

      feeType: data.fee_type,
    };
  }
}
