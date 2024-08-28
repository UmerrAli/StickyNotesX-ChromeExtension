const addNote = document.querySelector(".add-note-btn");

addNote.addEventListener("click", () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "addSticky"}, (response) => {
            console.log(response.status);
        });
    });
});
