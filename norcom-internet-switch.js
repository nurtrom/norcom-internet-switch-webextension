let browser = typeof window.browser === 'undefined' ? window.chrome : window.browser;

const APP_NAME = 'Norcom Internet Switch';

const STATE_ICONS = [
    {
        19: 'icons/internet-enabled-19.png',
        38: 'icons/internet-enabled-38.png'
    },

    {
        19: 'icons/internet-disabled-19.png',
        38: 'icons/internet-disabled-38.png'
    },

    {
        19: 'icons/internet-disabled-19.png',
        38: 'icons/internet-disabled-38.png'
    }
];

const STATE_TITLES = [
    'Выключить интернет Norcom',
    'Включить интернет Norcom',
    'Включить интернет Norcom',
];

const STATE_CHANGE_NOTIFICATIONS = [
    {
        type: 'basic',
        iconUrl: browser.extension.getURL('icons/internet-enabled-96.png'),
        title: APP_NAME
    },

    {
        type: 'basic',
        iconUrl: browser.extension.getURL('icons/internet-disabled-96.png'),
        title: APP_NAME
    },

    {
        type: 'basic',
        iconUrl: browser.extension.getURL('icons/internet-error-96.png'),
        title: APP_NAME
    }
];

function main() {
    let stateChangeTimeout;
    var state = 0;

    /* Проверим текущее состояние подключения. Установим соответсвующую иконку и уведомим пользователя. */
    getCurrentState().then((res) => {
        res.text().then((content) => {
            let r = parseResponse(content);
            updateView(r.state);
            showNotification(r.state, r.message);
            state = r.state;
        });
    });
    /* ================================================================================================ */
	
    browser.browserAction.onClicked.addListener(() => {
        state = +!state;

        if (stateChangeTimeout) {
            clearTimeout(stateChangeTimeout);
        }

        stateChangeTimeout = setTimeout(() => {
            toggleInternet(state).then((res) => {
                res.text().then((content) => {
                    let r = parseResponse(content);

                    /* 
                        Сообщение и иконка теперь зависят от возвращаемого результата.
                        Это позволяет избежать странного поведения, когда на счету, например, нет денег
                        или мы подключены к другой сети и кнопка нам недоступна.
                    */
                    showNotification(r.state, r.message);
                    updateView(r.state);

                    /* Обнуляет статус в случае ошибки. Нужно сделать красивее (: */
                    if (r.state > 1) {
                        state = 0;
                    }
                });
            });


        }, 500);
    });

    updateView(state);
}

function updateView(state) {
    return [updateIcon(state), updateTitle(state)];
}

function updateIcon(state) {
    let path = STATE_ICONS[state];
    return browser.browserAction.setIcon({path});
}

function updateTitle(state) {
    let title = STATE_TITLES[state];
    return browser.browserAction.setTitle({title});
}

function getEndpointUrl(state) {
    return `http://www.norcom.ru/core/keeper.php?act=keeper_change_status&status=${state}`;
}

function toggleInternet(state) {
    let url = getEndpointUrl(state);
    let req = new Request(url, {method: 'GET'});

    return fetch(req);
}

function getCurrentState() {
    let url = getEndpointUrl(-1);
    let req = new Request(url, { method: 'GET' });

    return fetch(req);
}

/* Парсим ответ. Выдаем сообщение и установившийся статус соединения. */
function parseResponse(content) {
    /* 
        За неимением подробной информации, будем исходить из того, что статус
        может принимать значения 0/1.
        Статус == 2 будет сигнализировать об ошибке.
    */
    let state = 2;
    let message = null;

    let state_match = content.match(/keeper_status.+?(-?\d+)/);

    if (state_match && state_match[1]) {
        state = parseInt(state_match[1]);
    }

    let message_match = content.match(/<span[^>]*>(.*?)<\/span>/);
    if (message_match && message_match[1]) {
        message = message_match[1].replace(/(<([^>]+)>)/ig, '');
    }

    return { state: state, message: message };
}

function showNotification(state, message) {
    var options = STATE_CHANGE_NOTIFICATIONS[state];
    options.message = message;

    browser.notifications.create('norcom-internet-switch-notification', options);
}

main();
