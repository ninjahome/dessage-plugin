document.addEventListener("DOMContentLoaded", initWelcomePage);
let __key_for_mnemonic_temp = '__key_for_mnemonic_temp__';

function initWelcomeDiv() {
    const agreeCheckbox = document.getElementById('welcome-agree');
    const createButton = document.getElementById('welcome-create');
    createButton.addEventListener('click', () => {
        navigateTo('#onboarding/create-password');
    });

    createButton.disabled = !agreeCheckbox.checked;
    agreeCheckbox.addEventListener('change', () => {
        createButton.disabled = !agreeCheckbox.checked;
    });

    const importButton = document.getElementById('welcome-import');
    importButton.addEventListener('click', importWallet);
}

function initPasswordDiv() {
    const passwordAgreeCheckbox = document.getElementById('password-agree');
    const createPasswordButton = document.querySelector('#view-create-password .primary-button');

    createPasswordButton.disabled = !passwordAgreeCheckbox.checked;
    createPasswordButton.addEventListener('click', createWallet);

    passwordAgreeCheckbox.addEventListener('change', checkImportPassword);
    document.getElementById("new-password").addEventListener('input', checkImportPassword);
    document.getElementById("confirm-password").addEventListener('input', checkImportPassword);

    const showPasswordButtons = document.querySelectorAll('.show-password');
    showPasswordButtons.forEach(button => {
        button.addEventListener('click', showPassword);
    });
}

function initMnemonicDiv() {
    const nextBtnForConfirm = document.querySelector('#view-recovery-phrase .primary-button');
    nextBtnForConfirm.addEventListener('click', nextToConfirmPage);
    document.getElementById("view-recovery-phrase-hide-seed").addEventListener('click', hideSeedDiv)
    document.getElementById("view-recovery-phrase-copy-seed").addEventListener('click', () => {
        if (!__key_for_mnemonic_temp) {
            return;
        }
        navigator.clipboard.writeText(__key_for_mnemonic_temp).then(r => {
            alert("copy success");
        })
    })
}

function initMnemonicConfirmDiv() {
    const confirmPhraseBtn = document.querySelector("#view-confirm-recovery .primary-button")
    confirmPhraseBtn.addEventListener('click', confirmUserInputPhrase);
}

function initImportFromWallet() {
    const recoveryPhraseLength = document.getElementById('recovery-phrase-length');
    recoveryPhraseLength.addEventListener('change', generateRecoveryPhraseInputs);

    const confirmRecoverBtn = document.querySelector('#view-import-wallet .primary-button');
    confirmRecoverBtn.addEventListener('click', confirmImportedWallet);
}

function initImportPasswordDiv() {
    const importBtn = document.querySelector("#view-password-for-imported .primary-button");
    importBtn.addEventListener('click', actionOfWalletImport)
    document.getElementById('imported-password-agree').addEventListener('change', checkImportPassword);
    document.getElementById("imported-new-password").addEventListener('input', checkImportPassword)
    document.getElementById("imported-confirm-password").addEventListener('input', checkImportPassword)
}

function router(path) {
    if (path === '#onboarding/recovery-phrase') {
        displayMnemonic();
    }
    if (path === '#onboarding/recovery-phrase') {
        displayConfirmVal();
    }
    if (path === '#onboarding/import-wallet') {
        generateRecoveryPhraseInputs();
    }
    if (path === '#onboarding/account-home') {
        prepareAccountData();
    }
}

async function initWelcomePage() {
    await initDatabase();
    initWelcomeDiv();
    initPasswordDiv();
    initMnemonicDiv();
    initMnemonicConfirmDiv();
    initImportFromWallet();
    initImportPasswordDiv();

    window.addEventListener('hashchange', function () {
        showView(window.location.hash);
    });

    showView(window.location.hash || '#onboarding/welcome');

    window.navigateTo = navigateTo;
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
    router(hash);
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
    navigateTo('#onboarding/import-wallet');
    generateRecoveryPhraseInputs();
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

function hideSeedDiv() {
    const recoveryPhraseContainer = document.querySelector('.recovery-phrase-container');
    let seedPhraseVisible = recoveryPhraseContainer.dataset.visible === 'true';
    if (seedPhraseVisible) {
        recoveryPhraseContainer.classList.add('hidden-seed-phrase');
        this.textContent = 'Reveal seed phrase';
    } else {
        recoveryPhraseContainer.classList.remove('hidden-seed-phrase');
        this.textContent = 'Hide seed phrase';
    }
    recoveryPhraseContainer.dataset.visible = '' + !seedPhraseVisible;
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
        div.id = '';
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

function generateRecoveryPhraseInputs() {
    setRecoverPhaseTips(false, '');
    const length = document.getElementById('recovery-phrase-length').value;
    const recoveryPhraseInputs = document.getElementById('recovery-phrase-inputs');
    recoveryPhraseInputs.innerHTML = '';

    const template = document.getElementById("recovery-phrase-row-template");
    for (let i = 0; i < length; i += 3) {
        const rowDiv = template.cloneNode(true);
        rowDiv.style.display = 'grid';
        rowDiv.id = '';
        recoveryPhraseInputs.appendChild(rowDiv);
        rowDiv.querySelectorAll("input").forEach(input => {
            input.addEventListener('input', validateRecoveryPhrase);
            input.nextElementSibling.addEventListener('click', changeInputType);
        })
    }
}

function changeInputType() {
    const input = this.previousElementSibling;
    if (input.type === "password") {
        input.type = "text";
        this.textContent = "🙈"; // Change button text to indicate hiding
    } else {
        input.type = "password";
        this.textContent = "👁"; // Change button text to indicate showing
    }
}


const wordlist = bip39.wordlists.english;

function validateRecoveryPhrase() {
    const wordsArray = this.value.split(' ');
    let errMsg = '';
    let everyWordIsOk = true;
    const inputs = document.querySelectorAll("#recovery-phrase-inputs .recovery-phrase")
    const length = Number(document.getElementById('recovery-phrase-length').value);

    if (wordsArray.length === 1) {
        const mnemonic = wordsArray[0];
        if (!wordlist.includes(mnemonic)) {
            setRecoverPhaseTips(false, "Invalid Secret Recovery Phrase");
            return;
        }

        const inputValues = [];
        inputs.forEach(input => {
            if (!input.value) {
                return;
            }

            const wordIsOk = wordlist.includes(input.value);
            if (!wordIsOk) {
                everyWordIsOk = false;
            }
            inputValues.push(input.value);
        });

        if (!everyWordIsOk) {
            setRecoverPhaseTips(false, "Invalid Secret Recovery Phrase");
            return;
        }

        if (inputValues.length !== length) {
            setRecoverPhaseTips(false, "Secret Recovery Phrases contain 12, 15, 18, 21, or 24 words");
            return;
        }
        setRecoverPhaseTips(true, "");
        return;
    }

    if (wordsArray.length !== length) {
        errMsg = "Secret Recovery Phrases contain 12, 15, 18, 21, or 24 words";
        setRecoverPhaseTips(false, errMsg);
        return;
    }

    for (let i = 0; i < length; i++) {
        inputs[i].value = wordsArray[i];
        const wordIsOk = wordlist.includes(wordsArray[i]);
        if (!wordIsOk) {
            everyWordIsOk = false;
        }
    }
    if (!everyWordIsOk) {
        setRecoverPhaseTips(false, "Invalid Secret Recovery Phrase");
        return;
    }
    const str = wordsArray.join(' ');
    const valid = bip39.validateMnemonic(str);
    if (!valid) {
        setRecoverPhaseTips(false, "Invalid Mnemonic String");
        return
    }

    setRecoverPhaseTips(true, "");
}

function setRecoverPhaseTips(isValid, errMsg) {
    const errorMessage = document.getElementById('error-message');
    if (isValid) {
        errorMessage.style.display = 'none';
        document.querySelector("#view-import-wallet .primary-button").disabled = false;
    } else {
        errorMessage.style.display = 'block';
        document.querySelector("#view-import-wallet .primary-button").disabled = true;
    }
    errorMessage.innerText = errMsg;
}


function confirmImportedWallet() {
    const inputs = document.querySelectorAll("#recovery-phrase-inputs .recovery-phrase")
    const inputValues = [];
    inputs.forEach(input => {
        inputValues.push(input.value);
    })
    const mnemonic = inputValues.join(' ');
    const valid = bip39.validateMnemonic(mnemonic);
    if (!valid) {
        alert("invalid mnemonic data")
        return;
    }

    __key_for_mnemonic_temp = mnemonic;
    navigateTo('#onboarding/password-for-imported');
}

function showPassword() {
    const form = this.closest('form');
    form.querySelectorAll("input").forEach(input => {
        if (input.type === 'password') {
            input.type = 'text';
        } else if (input.type === 'text') {
            input.type = 'password';
        }
    });
    if (this.textContent === 'Show') {
        this.textContent = 'Hide';
    } else {
        this.textContent = 'Show';
    }
}

async function actionOfWalletImport() {
    const password = document.getElementById("imported-new-password").value;
    const wallet = NewWallet(__key_for_mnemonic_temp, password);
    await wallet.syncToDb();
    __key_for_mnemonic_temp = null;
    navigateTo('#onboarding/account-home');
}

function checkImportPassword() {
    const form = this.closest('form');
    const okBtn = form.querySelector(".primary-button");
    let pwd = [];
    form.querySelectorAll("input").forEach(input => {
        if (input.type === 'password' || input.type === 'text') {
            pwd.push(input.value);
        }
    })

    const errMsg = form.querySelector(".error-message");

    if (pwd[0].length < 8 && pwd[0].length > 0) {
        errMsg.innerText = "password must be longer than 8 characters";
        errMsg.style.display = 'block';
        okBtn.disabled = true;
        return;
    }

    if (pwd[0] !== pwd[1]) {
        errMsg.innerText = "passwords are not same";
        errMsg.style.display = 'block';
        okBtn.disabled = true;
        return;
    }

    errMsg.innerText = '';
    errMsg.style.display = 'none';
    const checkbox = form.querySelector('input[type="checkbox"]');
    okBtn.disabled = !(checkbox.checked && pwd[0].length >= 8);
}

function prepareAccountData() {
    loadLocalWallet().then(ws => {
        console.log("all wallets:=>", ws);
    });
}