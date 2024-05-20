document.addEventListener("DOMContentLoaded", initWelcomePage);
let __key_for_mnemonic_temp = null;

async function initWelcomePage() {
    await initDatabase();

    const agreeCheckbox = document.getElementById('welcome-agree');
    const createButton = document.getElementById('welcome-create');
    createButton.addEventListener('click', () => {
        navigateTo('#onboarding/create-password');
    });

    createButton.disabled = !agreeCheckbox.checked;
    agreeCheckbox.addEventListener('change', function () {
        createButton.disabled = !agreeCheckbox.checked;
    });

    const importButton = document.getElementById('welcome-import');
    importButton.addEventListener('click', importWallet);

    const passwordAgreeCheckbox = document.getElementById('password-agree');
    const createPasswordButton = document.querySelector('#view-create-password .primary-button');

    createPasswordButton.disabled = !passwordAgreeCheckbox.checked;
    passwordAgreeCheckbox.addEventListener('change', function () {
        createPasswordButton.disabled = !passwordAgreeCheckbox.checked;
    });
    createPasswordButton.addEventListener('click', createWallet);


    const showPasswordButtons = document.querySelectorAll('.show-password');
    showPasswordButtons.forEach(button => {
        button.addEventListener('click', showPassword);
    });


    const nextBtnForConfirm = document.querySelector('#view-recovery-phrase .primary-button');
    nextBtnForConfirm.addEventListener('click', nextToConfirmPage);


    const confirmPhraseBtn = document.querySelector("#view-confirm-recovery .primary-button")
    confirmPhraseBtn.addEventListener('click', confirmUserInputPhrase);

    window.addEventListener('hashchange', function () {
        showView(window.location.hash);
    });
    if (window.location.hash === '#onboarding/recovery-phrase') {
        displayMnemonic();
    }
    if (window.location.hash === '#onboarding/recovery-phrase') {
        displayConfirmVal();
    }

    showView(window.location.hash || '#onboarding/welcome');

    window.navigateTo = navigateTo;
}

function showPassword() {
    const passwordInput = this.previousElementSibling;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        this.textContent = 'Show';
    }
}

function navigateTo(hash) {
    history.pushState(null, null, hash);
    showView(hash);
}

function showView(hash) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.style.display = 'none');

    const id = hash.replace('#onboarding/', 'view-');
    const targetView = document.getElementById(id);
    if (targetView) {
        targetView.style.display = 'block';
    }
}

async function createWallet() {
    const password1 = document.getElementById("new-password").value;
    const password2 = document.getElementById("confirm-password").value;
    if (password1 !== password2) {
        alert("passwords are not same");
        return;
    }

    if (password1.length === 0) {
        alert("password invalid");
        return;
    }

    const mnemonic = bip39.generateMnemonic();
    __key_for_mnemonic_temp = mnemonic;
    navigateTo('#onboarding/recovery-phrase');
    displayMnemonic();

    const wallet = NewWallet(mnemonic, password1);
    await wallet.syncToDb();
}


function importWallet() {
    // 导入钱包的逻辑
}

function displayMnemonic() {
    if (!__key_for_mnemonic_temp) {
        console.log("invalid mnemonic");
        return;
    }
    const wordsArray = __key_for_mnemonic_temp.split(' ');
    const mnemonicContainer = document.querySelector(".recovery-phrase-container");
    mnemonicContainer.innerHTML = ''; // 清空以前的内容

    wordsArray.forEach((word, index) => {
        const div = document.getElementById("recovery-phrase-item-template").cloneNode(true);
        div.style.display = 'block';
        div.querySelector(".phrase-item-index").innerText = index + 1;
        div.querySelector(".phrase-item-value").innerText = word;
        mnemonicContainer.appendChild(div);
    });
}

function nextToConfirmPage() {
    navigateTo('#onboarding/confirm-recovery');
    displayConfirmVal();
}

function displayConfirmVal() {
    if (!__key_for_mnemonic_temp) {
        console.log("error for mnemonic=>", __key_for_mnemonic_temp);
        return;
    }

    const wordsArray = __key_for_mnemonic_temp.split(' ');
    const indices = new Map();
    while (indices.size < 3) {
        const randomIndex = Math.floor(Math.random() * wordsArray.length);
        if (!indices.get(randomIndex)) {
            indices.set(randomIndex, true);
        }
    }

    const mnemonicContainer = document.querySelector(".recovery-phrase-grid");
    mnemonicContainer.innerHTML = '';
    wordsArray.forEach((word, index) => {
        let div;
        if (indices.get(index)) {
            div = document.getElementById("phrase-item-writeOnly").cloneNode(true);
            div.classList.add('hidden-word');
            div.dataset.correctWord = wordsArray[index];
        } else {
            div = document.getElementById("phrase-item-readOnly").cloneNode(true);
            div.querySelector(".recovery-input").value = word;
        }
        div.id = null;
        div.style.display = 'block';
        div.querySelector(".phrase-item-index").innerText = index + 1;
        mnemonicContainer.appendChild(div);
    });
}

function confirmUserInputPhrase() {
    const mnemonicContainer = document.querySelector(".recovery-phrase-grid");
    const itemToCheck = mnemonicContainer.querySelectorAll(".hidden-word");
    if (itemToCheck.length !== 3) {
        alert("input all mnemonic please");
        return;
    }
    let confirmed = true;
    itemToCheck.forEach(div => {
        if (div.querySelector(".recovery-input").value !== div.dataset.correctWord) {
            confirmed = false;
            div.classList.add("error-word");
        }
    })

    if (!confirmed) {
        return;
    }
    __key_for_mnemonic_temp = null;
    navigateTo('#onboarding/account-home');
}

