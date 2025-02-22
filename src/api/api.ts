export const createAnnouncement = async (data: { translations: { en: { title: string; description: string }; ru: { title: string; description: string } } }) => {
    const response = await fetch('https://debttracker.uz/ru/announcements/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return response.json();
};
