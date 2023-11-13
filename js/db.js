
        
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
    import { 
        getFirestore,
        collection,
        getDocs,
        doc,
        setDoc,
        updateDoc
    } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';
    import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
    
    const DOCUMENT = '76361408-b267-4ac3-abe7-6d5e48b2ea50';
    const COLLECTION = 'quizzes';
    
    const firebaseConfig = {
        apiKey: "AIzaSyBtRpmqYLGE-DUJ_qkdK5NT0J3RsGpXjvU",
        authDomain: "ola-quizz.firebaseapp.com",
        projectId: "ola-quizz",
        storageBucket: "ola-quizz.appspot.com",
        messagingSenderId: "274194150561",
        appId: "1:274194150561:web:d8954ca406eb6f2ff16ce0",
        measurementId: "G-BLTT8RTB6L",
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const analytics = getAnalytics(app);
    
    async function findDocument() {
        const quizzesCol = collection(db, COLLECTION);
        const quizzSnapshot = await getDocs(quizzesCol);
        const document = quizzSnapshot.docs.find(doc => doc.id === DOCUMENT);
        return document;
    }
    
    export async function getAnswers() {
        const document = await findDocument();
        if (document) {
            return document.data();
        }    
        return [];
    }
    
    export async function addOneAnswer(answer) {
        const answerList = await getAnswers();
        let answerQuantity = answerList[answer];
        answerQuantity++;
        const ref = doc(db, COLLECTION, DOCUMENT);
        await updateDoc( ref, {[answer]: answerQuantity} );
    }  
    
    export async function createDocument() {
        await setDoc(doc(db, COLLECTION, DOCUMENT), {
            respuesta_a: 0,
            respuesta_b: 0,
            respuesta_c: 0,
            respuesta_d: 0,
            like: 0,
            dislike: 0,
        });
    }

    export function registerAnalytic(event, opcion) {
        const nameEvent = DOCUMENT + "_" + event;
        if( opcion ) {
            logEvent(analytics, event, opcion);
        } else {
            logEvent(analytics, event);
        }
        
    }
    