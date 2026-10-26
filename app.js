import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBbQ9PcShTYzAiGPOHIkAi6v7B2RSi8jVM",
    authDomain: "flujograma-8edd9.firebaseapp.com",
    projectId: "flujograma-8edd9",
    storageBucket: "flujograma-8edd9.firebasestorage.app",
    messagingSenderId: "63514618848",
    appId: "1:63514618848:web:29f8c2529a071efbf31985"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencia al documento único del flujograma en la colección "tesis"
const flowDocRef = doc(db, "flujogramas", "fonoaudiologia_principal");

document.addEventListener('DOMContentLoaded', async () => {
    const keys = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'];
    const btnGenerate = document.getElementById('btn-generate');
    const dbStatus = document.getElementById('db-status');

    let isRemoteUpdating = false;

    // 1. Cargar datos iniciales desde la Base de Datos al abrir la app
    try {
        const docSnap = await getDoc(flowDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            keys.forEach(key => {
                if (data[key]) {
                    if (document.getElementById(`edit-title-${key}`)) document.getElementById(`edit-title-${key}`).value = data[key].title || '';
                    if (document.getElementById(`edit-body-${key}`)) document.getElementById(`edit-body-${key}`).value = data[key].body || '';
                    if (document.getElementById(`edit-val-${key}`)) document.getElementById(`edit-val-${key}`).value = data[key].val || '';
                }
            });
            dbStatus.textContent = "Sincronizado con la Base de Datos";
            dbStatus.className = "db-status synced";
        } else {
            // Si no existe, creamos el documento inicial con los valores por defecto
            await saveToDatabase();
        }
    } catch (error) {
        console.error("Error al cargar de Firestore:", error);
        dbStatus.textContent = "Modo Offline / Error de conexión";
        dbStatus.className = "db-status error";
    }

    // Actualiza la vista visual del diagrama en pantalla
    function updateVisualFlowchart() {
        keys.forEach(key => {
            const inputTitle = document.getElementById(`edit-title-${key}`);
            const inputBody = document.getElementById(`edit-body-${key}`);
            const inputVal = document.getElementById(`edit-val-${key}`);

            const nodeTitle = document.getElementById(`node-title-${key}`);
            const nodeBody = document.getElementById(`node-body-${key}`);
            const nodeVal = document.getElementById(`node-val-${key}`);

            if (inputTitle && nodeTitle) nodeTitle.textContent = inputTitle.value;
            if (inputBody && nodeBody) nodeBody.textContent = inputBody.value;
            if (inputVal && nodeVal) {
                const val = inputVal.value.trim();
                nodeVal.textContent = val ? `(${val})` : '';
                nodeVal.style.display = val ? 'inline-block' : 'none';
            }
        });
    }

    // 2. Función de Guardado optimizada con estructura de datos consolidada
    async function saveToDatabase() {
        if (isRemoteUpdating) return;
        dbStatus.textContent = "Guardando cambios...";
        dbStatus.className = "db-status syncing";

        const payload = {};
        keys.forEach(key => {
            payload[key] = {
                title: document.getElementById(`edit-title-${key}`)?.value || "",
                body: document.getElementById(`edit-body-${key}`)?.value || "",
                val: document.getElementById(`edit-val-${key}`)?.value || ""
            };
        });

        try {
            await setDoc(flowDocRef, payload, { merge: true });
            dbStatus.textContent = "Sincronizado con la Base de Datos";
            dbStatus.className = "db-status synced";
        } catch (error) {
            console.error("Error al guardar en Firestore:", error);
            dbStatus.textContent = "Error al sincronizar cambios";
            dbStatus.className = "db-status error";
        }
    }

    // 3. Sistema de "Debounce" (Evita que la app se trabe al registrar datos externos o tipeo rápido)
    let saveTimeout = null;
    function handleInputChanges() {
        updateVisualFlowchart();
        
        dbStatus.textContent = "Escribiendo...";
        dbStatus.className = "db-status syncing";

        clearTimeout(saveTimeout);
        // Espera 800ms de inactividad antes de escribir en la base de datos para prevenir congestión o bloqueos de red
        saveTimeout = setTimeout(() => {
            saveToDatabase();
        }, 800);
    }

    // Vincular eventos a todos los inputs
    keys.forEach(key => {
        ['title', 'body', 'val'].forEach(type => {
            const el = document.getElementById(`edit-${type}-${key}`);
            if (el) {
                el.addEventListener('input', handleInputChanges);
            }
        });
    });

    // Renderizar estado visual inicial
    updateVisualFlowchart();

    // Botón de Impresión / Generar PDF
    btnGenerate.addEventListener('click', () => {
        updateVisualFlowchart();
        btnGenerate.style.transform = 'scale(0.98)';
        setTimeout(() => { btnGenerate.style.transform = 'none'; }, 150);
        window.print();
    });
});