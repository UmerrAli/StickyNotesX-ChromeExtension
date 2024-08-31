const addNote = document.querySelector(".add-note-btn");
const clearAll = document.querySelector(".clear-btn");
const notesContainer = document.querySelector(".notes-container");

// render note on popup page
const renderNote = function(noteData){
    const note = document.createElement('div');
    note.classList.add("note")
    note.innerHTML = `
    <div class="heading">
        <div class="title">${noteData.title}</div>
        <div class="url"><a href="${noteData.url}">${noteData.url}</a></div>
    </div>
    <div class="text">${noteData.description}</div>`
    notesContainer.appendChild(note);
}

const renderAllNotes = function (){
    chrome.storage.local.get('notesData', (data) => {
        if (!data["notesData"])
            return;
        Object.values(data["notesData"]).forEach(values => {
            values.forEach(noteData =>{
                renderNote(noteData);
            });
        });
    });
}

addNote.addEventListener("click", () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "addSticky"},() => {
            notesContainer.innerHTML = ''
            setTimeout(() => renderAllNotes(), 200);
        });
    });
});

clearAll.addEventListener("click", () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "clearAll"},() => {notesContainer.innerHTML = ''});
    });
});

renderAllNotes();