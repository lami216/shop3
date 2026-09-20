export const createOrderAccessConfig = (accessToken) => {
  const token = typeof accessToken === "string" ? accessToken.trim() : "";
  return token ? { headers: { "X-Order-Access-Token": token } } : {};
};
