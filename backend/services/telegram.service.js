const TELEGRAM_API = "https://api.telegram.org";

const getConfig = () => ({
	token: process.env.TELEGRAM_BOT_TOKEN,
	chatId: process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID,
});

export const sendTelegramMessage = async (text) => {
	const { token, chatId } = getConfig();

	if (!token || !chatId) {
		return false;
	}

	try {
		const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text,
			}),
		});

		return response.ok;
	} catch (error) {
		console.error("Telegram send error", error.message);
		return false;
	}
};
