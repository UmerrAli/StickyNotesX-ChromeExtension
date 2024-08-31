// Link font-awesome
const link = document.createElement('link');
link.rel = "stylesheet";
link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css";
link.integrity = "sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg==";
link.crossOrigin = "anonymous";
link.referrerPolicy = "no-referrer";
document.head.prepend(link);

let activeElement = null;
let offsetX, offsetY;

// Create a container for sticky notes
const stickyNotesContainer = document.createElement('div');
stickyNotesContainer.id = 'sticky-notes-container';
document.documentElement.prepend(stickyNotesContainer);
const addStickyNote = function(noteData = {}) {
    const container = document.createElement('div');
    container.classList.add('note-container');
    
    container.innerHTML = `
    <div class="header">
        <input class="title" placeholder="Title" value="${noteData.title || 'Title'}">
        <div class="buttons">
            <div class="colors notesX-hidden">
                <div class="yellow color" style="background-color:#FFD700;"></div>
                <div class="blue color" style="background-color:#0044CC;"></div>
                <div class="red color" style="background-color:#ff0000;"></div>
            </div>
            <i class="fa-solid fa-palette color-btn" style="font-size: 18px;"></i>
            <i class="fa-solid fa-trash delete-btn" style="font-size: 18px;"></i>
            <i class="fa-solid fa-minus minus-btn" style="font-size: 18px;"></i>
        </div>
    </div>
    <textarea name="note" placeholder="Write your notes here!">${noteData.description || ''}</textarea>`;

    container.style.setProperty('--color-primary', noteData.colorPrimary || '#FFD700');
    container.style.setProperty('--color-secondary', noteData.colorSecondary || '#FFFAE3');
    container.style.top = noteData.position ? noteData.position.top : '100px';
    container.style.left = noteData.position ? noteData.position.left : '100px';

    stickyNotesContainer.appendChild(container);
};

const applyColor = function(noteContainer, primaryColor, secondaryColor) {
    noteContainer.style.setProperty('--color-primary', primaryColor);
    noteContainer.style.setProperty('--color-secondary', secondaryColor);
}

// storing notes
const saveNotesToStorage = function() {
    const url = window.location.href;
    const notes = [];
    
    document.querySelectorAll('.note-container').forEach(note => {
        const title = note.querySelector('.title').value;
        const description = note.querySelector('textarea').value;
        const colorPrimary = getComputedStyle(note).getPropertyValue('--color-primary').trim();
        const colorSecondary = getComputedStyle(note).getPropertyValue('--color-secondary').trim();
        const position = {
            top: note.style.top,
            left: note.style.left
        };
        notes.push({
            title,
            description,
            colorPrimary,
            colorSecondary,
            position,
            url
        });
    });

    chrome.storage.local.get('notesData', (data) => {
        data.notesData = data.notesData || {};
        data.notesData[url] = notes;
        chrome.storage.local.set({ notesData: data.notesData });
    });
}   

const loadNotesFromStorage = function() {
    const url = window.location.href;
    chrome.storage.local.get('notesData', (data) => {
        if (data.notesData && data.notesData[url]) {
            data.notesData[url].forEach(noteData => {
                addStickyNote(noteData);
            });
        }
    });
}

// Making note container draggable
const onMouseMove = function(e) {
    if (activeElement) {
        activeElement.style.left = `${e.clientX - offsetX}px`;
        activeElement.style.top = `${e.clientY - offsetY}px`;
    }
}

const updatePosition = function(e) {
    requestAnimationFrame(() => onMouseMove(e));
}

stickyNotesContainer.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('header')) {
        activeElement = e.target.parentElement;
        offsetX = e.clientX - activeElement.offsetLeft;
        offsetY = e.clientY - activeElement.offsetTop;
        document.addEventListener('mousemove', updatePosition);
    }
});

stickyNotesContainer.addEventListener('mouseup', () => {
    if (activeElement) {
        saveNotesToStorage();
        activeElement = null;
        document.removeEventListener('mousemove', updatePosition);
    }
});

// Handle clicks for minimize, delete, and color toggle
stickyNotesContainer.addEventListener('click', (e) => {
    const noteContainer = e.target.closest('.note-container');

    if (e.target.classList.contains('minus-btn')) {
        const textarea = noteContainer.querySelector('textarea');
        textarea.classList.toggle('notesX-hidden');
    } else if (e.target.classList.contains('delete-btn')) {
        noteContainer.remove();
        saveNotesToStorage();
    } else if (e.target.classList.contains('color-btn')) {
        const colors = noteContainer.querySelector('.colors');
        colors.classList.toggle('notesX-hidden');
    } else if (e.target.classList.contains('color')) {
        if (e.target.classList.contains('yellow')){
            applyColor(noteContainer, '#FFD700', '#FFFAE3');
        } else if (e.target.classList.contains('blue')){
            applyColor(noteContainer, '#0044CC', '#ADD8E6');
        }  else {
            applyColor(noteContainer, '#ff0000', '#FFCCCC');
        }
        saveNotesToStorage();
    }
});

// When user click on add button from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addSticky") {
        addStickyNote();
        saveNotesToStorage(); 
    } else if (request.action === "clearAll") {
        chrome.storage.local.clear();
        document.querySelectorAll('.note-container').forEach(note => note.remove());
    }
    sendResponse({status:"done"})
    return true;
});

// Save after input change
stickyNotesContainer.addEventListener('input', () => {
    saveNotesToStorage();  
});

link.onload = () => loadNotesFromStorage();




