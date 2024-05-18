document.addEventListener("DOMContentLoaded", initWelcomePage);

function initWelcomePage() {
    const agreeCheckbox = document.getElementById('welcome-agree');
    const createButton = document.getElementById('welcome-create');
    createButton.addEventListener('click', () => {
        navigateTo('#onboarding/create-password');
    });

    // 初始状态
    createButton.disabled = !agreeCheckbox.checked;

    // 当复选框状态改变时更新按钮状态
    agreeCheckbox.addEventListener('change', function () {
        createButton.disabled = !agreeCheckbox.checked;
    });

    const importButton = document.getElementById('welcome-import');
    importButton.addEventListener('click', importWallet);

    const passwordAgreeCheckbox = document.getElementById('password-agree');
    const createPasswordButton = document.querySelector('#view-create-password .primary-button');

    // 初始状态
    createPasswordButton.disabled = !passwordAgreeCheckbox.checked;

    // 当复选框状态改变时更新按钮状态
    passwordAgreeCheckbox.addEventListener('change', function () {
        createPasswordButton.disabled = !passwordAgreeCheckbox.checked;
    });
    createPasswordButton.addEventListener('click', createWallet);


    const showPasswordButtons = document.querySelectorAll('.show-password');
    showPasswordButtons.forEach(button => {
        button.addEventListener('click',  showPassword);
    });

    window.addEventListener('hashchange', function () {
        showView(window.location.hash);
    });

    if (window.location.hash === '#onboarding/recovery-phrase'){
        const mnemonic = localStorage.getItem('mnemonic');
        if(mnemonic){
            displayMnemonic(mnemonic);
        }
    }

    showView(window.location.hash || '#onboarding/welcome');

    window.navigateTo = navigateTo;
}

function showPassword(){
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

function createWallet() {
    const mnemonic = bip39.generateMnemonic();
    localStorage.setItem('mnemonic', mnemonic); // 保存到本地存储
    navigateTo('#onboarding/recovery-phrase');
    displayMnemonic(mnemonic);
}

function importWallet() {
    // 导入钱包的逻辑
}

function displayMnemonic(mnemonic) {
    const wordsArray = mnemonic.split(' ');
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