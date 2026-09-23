export const buildLegacyGuestClaimUrl = (origin, claimPath) =>
  new URL(claimPath, origin).toString();

export const getLegacyClaimTokenFromHash = (hash) =>
  new URLSearchParams(String(hash || "").replace(/^#/, "")).get("token");

export const removeLegacyClaimTokenFromAddress = (history, location) =>
  history.replaceState(history.state, "", `${location.pathname}${location.search}`);

export const consumeLegacyGuestOrderClaim = async ({
  apiClient,
  orderId,
  claimToken,
  persistGuestOrder,
}) => {
  const claimed = await apiClient.post(
    `/orders/${encodeURIComponent(orderId)}/legacy-guest-claim`,
    { token: claimToken }
  );
  persistGuestOrder(claimed.trackingCode, claimed.guestAccessToken);
  return claimed;
};
