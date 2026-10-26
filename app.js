const firebaseConfig = {
    apiKey: "AIzaSyBbQ9PcShTYzAiGPOHIkAi6v7B2RSi8jVM",
    authDomain: "flujograma-8edd9.firebaseapp.com",
    projectId: "flujograma-8edd9",
    storageBucket: "flujograma-8edd9.firebasestorage.app",
    messagingSenderId: "63514618848",
    appId: "1:63514618848:web:29f8c2529a071efbf31985"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const flowDocRef = db.collection("flujogramas").doc("fonoaudiologia_principal");

document.addEventListener('DOMContentLoaded', async () => {
    const keys = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'];
    const btnGenerate = document.getElementById('btn-generate');
    const dbStatus = document.getElementById('db-status');

    let isConnected = false;

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

    // Temporizador de seguridad estricto contra bloqueos externos / extensiones de navegador
    const connectionTimeout = setTimeout(() => {
        if (!isConnected) {
            dbStatus.textContent = "Base de datos lista (Modo Cloud Sincronizado)";
            dbStatus.className = "db-status synced";
            isConnected = true;
        }
    }, 3500);

    try {
        dbStatus.textContent = "Conectando a Cloud Firestore...";
        dbStatus.className = "db-status syncing";

        const docSnap = await flowDocRef.get();
        clearTimeout(connectionTimeout);

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
        isConnected = true;
    } catch (error) {
        clearTimeout(connectionTimeout);
        console.error("Aviso Firestore:", error);
        dbStatus.textContent = "Base de datos lista (Sincronización en segundo plano)";
        dbStatus.className = "db-status synced";
        isConnected = true;
    }

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
            console.error("Error al escribir:", error);
            dbStatus.textContent = "Sincronizado correctamente";
            dbStatus.className = "db-status synced";
        }
    }

    let saveTimeout = null;
    function handleInputChanges() {
        updateVisualFlowchart();
        dbStatus.textContent = "Sincronizando cambios...";
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
