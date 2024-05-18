document.addEventListener("DOMContentLoaded", initWelcomePage);

function initWelcomePage() {
    const agreeCheckbox = document.getElementById('welcome-agree');
    const createButton = document.getElementById('welcome-create');
    createButton.addEventListener('click', ()=>{navigateTo('#onboarding/create-password');});

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
        button.addEventListener('click', function () {
            const passwordInput = this.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.textContent = 'Hide';
            } else {
                passwordInput.type = 'password';
                this.textContent = 'Show';
            }
        });
    });

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
}

function createWallet() {
    navigateTo('#onboarding/recovery-phrase');
}

function importWallet() {
    // 导入钱包的逻辑
}
