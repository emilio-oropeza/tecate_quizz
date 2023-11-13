import { result } from './result.js';
import { getAnswers, addOneAnswer, createDocument, registerAnalytic } from './db.js';

const questionContainers = document.querySelector('#questions > form > .container');
const totalNumberQuestions = document.getElementsByClassName('question').length;
const progressBar = document.querySelectorAll('.progress');
const progressText = document.querySelectorAll('.quizz-progress-txt');
const coverLink = document.getElementById('coverLink');
const showResultButton = document.getElementById('show-results-button');
const likeButton = document.getElementById('like-button');
const dislikeButton = document.getElementById('dislike-button');
const draggables = document.querySelectorAll('.draggable');
const dropzones = document.querySelectorAll('.dropzone');
const quizzSwipeOptions = document.querySelectorAll('.quizz-swipe-options');

const minWindowSize = 1280;
let currentPosition = 1280;
let currentQuestion = 0;
let timeInQuizz;
const questionsTimes = [10,10,8,9,10];
const answers = []

const radioButttons = document.querySelectorAll('input[type="radio"]');
radioButttons.forEach(radioButton => radioButton.addEventListener('change', answerSelect))
progressBar.forEach((pB, i) => {
    const q = 1 + i;
    const percentage = Math.round((100 * q) / totalNumberQuestions);
    pB.style.width = percentage + '%';
});
progressText.forEach((pT, i) => { pT.innerHTML = (i+1) + ' de ' + (totalNumberQuestions) });
showResultButton.addEventListener('click', toggleResults);
likeButton.addEventListener('click', addLike);
dislikeButton.addEventListener('click', addDislike);

draggables.forEach(draggable => {
    draggable.addEventListener('touchstart', pickup);
    draggable.addEventListener('touchmove', move);
    draggable.addEventListener('touchend', drop);
    
    draggable.addEventListener('mousedown', pickup);
    draggable.addEventListener('mousemove', move);
    draggable.addEventListener('mouseup', drop);
});

quizzSwipeOptions.forEach(quizzSwipeOption => {
    quizzSwipeOption.addEventListener('touchmove', move);
    quizzSwipeOption.addEventListener('mousemove', move);
});

dropzones.forEach(dropzone => {
    dropzone.addEventListener('touchend', drop);
    dropzone.addEventListener('mouseup', drop);
});

async function init() {
    coverLink.addEventListener('click', goToNextQuestion);
    const answers = await getAnswers();
    
    if (answers.length === 0) {
        await createDocument();
    }

    timeInQuizz = Date.now();
    registerAnalytic('reproduccion_de_portada');
}

function blurNotSelected(elements) {
    elements.forEach(el => {
        (el.localName) ? el.classList.add("notChecked") : null;
    });
}

function startTimer(time, id) {
    const timeElement = document.getElementById(id);
    timeElement.innerHTML = time+'';
    let addTime = new Date();
    addTime.setSeconds(addTime.getSeconds() + time);
    let countDownDate = addTime.getTime();
    let interval = setInterval( function() {
        let now = new Date().getTime();
        let distance = countDownDate - now;
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);
        timeElement.style.opacity = (seconds % 2 == 0)? '0.6' : '1';
        if (seconds >= 0){
            timeElement.innerHTML = seconds+'';
        }
        if (distance <= 0) {
            clearInterval(interval);
        }        
        
    }, 1000);
}

function getResult(array){
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

async function showResult(res) {
    const texts = document.querySelectorAll('.data-text');
    const arr = ['a', 'b', 'c', 'd'];
    document.querySelector('.result-image-container img').src = './img/' + result[res].image;
    document.querySelector('.result-title').innerHTML = result[res].title + '';
    document.querySelector('.result-description').innerHTML = result[res].description + '';
    await addOneAnswer(('respuesta_'+res));
    registerAnalytic('resultado', {"opcion": res});

    let timeInMs = new Date(Date.now() - timeInQuizz);    
    registerAnalytic('tiempo_en_quizz', {'segundos':(timeInMs.getTime()/1000)});

    const answers = await getAnswers();
    const orderedAns = Object.keys(answers).sort().reduce(
        (obj, key) => { 
            obj[key] = answers[key]; 
            return obj;
        }, 
        {}
    );
    const ansArr = Object.values(orderedAns);
    const totalAns = ansArr.reduce((accumulator, value) => {
        return accumulator + value;
    }, 0);
    texts.forEach((txt, i) => {
        const letter = arr[i];
        const percentage = Math.round((100 * answers['respuesta_'+letter]) / totalAns);
        txt.innerHTML = percentage + '% ' + result[letter].title;
        txt.parentElement.querySelector('.data-progress').style.width = percentage + '%';
        if (letter === res) {
            txt.classList.add('user');
            txt.parentElement.querySelector('.data-progress').classList.add('user');
        }        
    });
}

function getValues() {
    const finalResult = getResult(answers);
    showResult(finalResult);
}

function goToNextQuestion(){
    if (currentQuestion === 0) {
        registerAnalytic('click_en_portada');
    }

    if (currentQuestion < totalNumberQuestions) {
        currentQuestion++;
        currentPosition -= minWindowSize;
        questionContainers.style.left = currentPosition + 'px';
        startTimer(questionsTimes[currentQuestion-1], ('timer' + currentQuestion));
    } else {
        getValues();
        setTimeout(() => {
            document.getElementById("result").scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 1000); 
    }
}

function answerSelect(e) {
    e.preventDefault();
    blurNotSelected(e.target.parentElement.parentElement.childNodes);
    registerAnalytic(('pregunta_' + currentQuestion), {'respuesta': e.target.value});
    goToNextQuestion();
}

function toggleResults(e) {
    e.preventDefault();
    const resultText = document.getElementById('result-text');
    const resultData = document.getElementById('result-data');
    const button = document.querySelector('.button-reaction.show-results');
    if (resultText.style.display == 'block'){
        resultText.style.display = 'none';
        resultData.style.display = 'flex';
        button.classList.add('close');
    } else {
        resultText.style.display = 'block';
        resultData.style.display = 'none';
        button.classList.remove('close');
    }
}

async function addLike(){
    e.preventDefault();
    await addOneAnswer('like');
    likeButton.removeEventListener('click', addLike);
}
async function addDislike(){
    e.preventDefault();
    await addOneAnswer('dislike');
    dislikeButton.removeEventListener('click', addDislike);
}

// Swipe

let moving = null;

function pickup(event) {
    moving = event.target;

    moving.style.height = moving.clientHeight;
    moving.style.width = moving.clientWidth;
    moving.style.position = 'fixed';
}

function move(event) {
    if (moving) {
        if (event.clientX) {
            moving.style.left = event.clientX - moving.clientWidth/2;
            moving.style.top = event.clientY - moving.clientHeight/2;
        } else {
            moving.style.left = event.changedTouches[0].clientX - moving.clientWidth/2;
            moving.style.top = event.changedTouches[0].clientY - moving.clientHeight/2;
        }
    }
}

function drop(event) {
    if (moving) {
        if (event.currentTarget.tagName !== 'HTML') {
            let target = null;
            if (event.clientX) {
                target = document.elementFromPoint(event.clientX, event.clientY);
            } else {
                target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
            }

            if (target) {
                if (target.classList.contains('dropzone')) {
                    target.classList.add('dropzone--filled');
                    answers.push(target.dataset.choise);
                    goToNextQuestion();
                } else {
                    target = target.closest('.dropzone');
                    if (target) {
                        target.classList.add('dropzone--filled');
                        answers.push(target.dataset.choise);
                        goToNextQuestion();
                    }
                }
            }
        }

        moving.style.left = '';
        moving.style.top = '';
        moving.style.height = '';
        moving.style.width = '';
        moving.style.position = '';

        moving = null;
    }
}

init();


