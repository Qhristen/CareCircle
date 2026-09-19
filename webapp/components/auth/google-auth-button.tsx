"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "@/lib/api-error";
import { useGoogleLoginMutation } from "@/lib/store/api/authApi";
import { useAppDispatch } from "@/lib/store/hooks";
import { setCredentials } from "@/lib/store/slices/authSlice";

export function GoogleAuthButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [googleLogin, { isLoading }] = useGoogleLoginMutation();
  const [error, setError] = useState("");
  const configured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  if (!configured) {
    return (
      <div className="mb-6">
        <button
          className="w-full cursor-not-allowed rounded-full bg-surface-container px-4 py-3 text-xs font-bold text-on-surface-variant opacity-70"
          disabled
          type="button"
        >
          {t("auth.googleNotConfigured")}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-2">
      <div className={`flex min-h-11 justify-center ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
        <GoogleLogin
          onError={() => setError(t("auth.googleStartError"))}
          onSuccess={async ({ credential }) => {
            if (!credential) {
              setError(t("auth.googleCredentialError"));
              return;
            }
            try {
              const response = await googleLogin({ idToken: credential, platform: "web" }).unwrap();
              dispatch(setCredentials({ user: response.user }));
              const requestedPath = new URLSearchParams(window.location.search).get("next");
              router.push(requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/explore-circles");
            } catch (requestError) {
              setError(getApiErrorMessage(requestError, t("auth.googleFailed")));
            }
          }}
          shape="pill"
          size="large"
          text="continue_with"
          theme="outline"
          width="360"
        />
      </div>
      {error && <p className="text-center text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  );
}
