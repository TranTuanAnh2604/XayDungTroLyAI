const BASE_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export const connectGmail = (googleRefreshToken) =>
    fetch(`${BASE_URL}/api/gmail/connect`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ googleRefreshToken }),
    }).then((r) => r.json());

export const autoSyncGmail = () =>
    fetch(`${BASE_URL}/api/gmail/auto-sync`, {
        method: "POST",
        headers: getHeaders(),
    }).then((r) => r.json());

// Đổi tên khớp với Gmail.jsx
export const getInboxGmails = (maxResults = 15) =>
    fetch(`${BASE_URL}/api/gmail/inbox?maxResults=${maxResults}`, {
        headers: getHeaders(),
    }).then((r) => r.json());

export const getGmailDetail = (messageId) =>
    fetch(`${BASE_URL}/api/gmail/inbox/${messageId}`, {
        headers: getHeaders(),
    }).then((r) => r.json());

export const summarizeGmail = (messageId) =>
    fetch(`${BASE_URL}/api/gmail/summarize/${messageId}`, {
        method: "POST",
        headers: getHeaders(),
    }).then((r) => r.json());

export const summarizeAllGmails = (maxResults = 15) =>
    fetch(`${BASE_URL}/api/gmail/summarize-all?maxResults=${maxResults}`, {
        method: "POST",
        headers: getHeaders(),
    }).then((r) => r.json());