// Configuración provista por Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBbQ9PcShTYzAiGPOHIkAi6v7B2RSi8jVM",
    authDomain: "flujograma-8edd9.firebaseapp.com",
    projectId: "flujograma-8edd9",
    storageBucket: "flujograma-8edd9.firebasestorage.app",
    messagingSenderId: "63514618848",
    appId: "1:63514618848:web:29f8c2529a071efbf31985"
};

// Inicializar Firebase usando la interfaz global compatible con static hosting
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Referencia directa al documento en Firestore
const flowDocRef = db.collection("flujogramas").doc("fonoaudiologia_principal");

document.addEventListener('DOMContentLoaded', async () => {
    const keys = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'];
    const btnGenerate = document.getElementById('btn-generate');
    const dbStatus = document.getElementById('db-status');

    // 1. Carga inicial desde Firestore de forma síncrona/asíncrona directa
    try {
        dbStatus.textContent = "Conectando a Cloud Firestore...";
        dbStatus.className = "db-status syncing";

        const docSnap = await flowDocRef.get();
        if (docSnap.exists) {
            const data = docSnap.data();
            keys.forEach(key => {
                if (data[key]) {
                    if (document.getElementById(`edit-title-${key}`)) document.getElementById(`edit-title-${key}`).value = data[key].title || '';
                    if (document.getElementById(`edit-body-${key}`)) document.getElementById(`edit-body-${key}`).value = data[key].body || '';
                    if (document.getElementById(`edit-val-${key}`)) document.getElementById(`edit-val-${key}`).value = data[key].val || '';
                }
            });
            dbStatus.textContent = "Base de datos sincronizada";
            dbStatus.className = "db-status synced";
        } else {
            await saveToDatabase();
        }
    } catch (error) {
        console.error("Error al conectar con Firestore:", error);
        dbStatus.textContent = "Error de conexión con la Base de Datos";
        dbStatus.className = "db-status error";
    }

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

    // 2. Función de guardado estricto en Firestore
    async function saveToDatabase() {
        dbStatus.textContent = "Guardando en Firestore...";
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
            await flowDocRef.set(payload, { merge: true });
            dbStatus.textContent = "Base de datos sincronizada";
            dbStatus.className = "db-status synced";
        } catch (error) {
            console.error("Error al guardar en Firestore:", error);
            dbStatus.textContent = "Error al actualizar base de datos";
            dbStatus.className = "db-status error";
        }
    }

    let saveTimeout = null;
    function handleInputChanges() {
        updateVisualFlowchart();
        dbStatus.textContent = "Cambios pendientes...";
        dbStatus.className = "db-status syncing";

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToDatabase();
        }, 600);
    }

    keys.forEach(key => {
        ['title', 'body', 'val'].forEach(type => {
            const el = document.getElementById(`edit-${type}-${key}`);
            if (el) {
                el.addEventListener('input', handleInputChanges);
            }
        });
    });

    updateVisualFlowchart();

    btnGenerate.addEventListener('click', () => {
        updateVisualFlowchart();
        btnGenerate.style.transform = 'scale(0.98)';
        setTimeout(() => { btnGenerate.style.transform = 'none'; }, 150);
        window.print();
    });
});
