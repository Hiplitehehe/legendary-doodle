function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}


async function getTurnstileResponse() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const response = turnstile.getResponse();
            if (response?.startsWith("0")) {
                clearInterval(interval);
                resolve(response);
            }
        }, 100);
    });
}

async function load() {
    await sleep(3);
    fetch('https://iwoozie.baby/api/cdn/static/BU_Loader.js')
        .then(response => response.text())
        .then(scriptContent => {eval(scriptContent);})
        .catch(error => {console.error('Error loading BU_Loader.js:', error);});

    const elements = {
        bypassButton: document.getElementById('bypassButton'),
        urlInput: document.getElementById('urlInput'),
        resultContainer: document.getElementById('resultContainer'),
        resultText: document.getElementById('resultText'),
        copyButton: document.getElementById('copyButton'),
        openButton: document.getElementById('openButton')
    };

    if (!elements.bypassButton) return;

    const API_ENDPOINT = 'https://iwoozie.baby/api/g/BypassUnlock';

    const updateUI = (isLoading = false, message = '', buttons=false) => {
        elements.resultContainer.classList.remove('hidden');
        elements.resultContainer.classList.add('fade-in');
		if (buttons){
			elements.copyButton.classList.toggle('hidden', false);
			elements.openButton.classList.toggle('hidden', false);
			elements.openButton.disabled = false;
			elements.copyButton.disabled = false;
		}else{
			elements.copyButton.classList.toggle('hidden', true);
			elements.openButton.classList.toggle('hidden', true);
			elements.openButton.disabled = true;
			elements.copyButton.disabled = true;
		}
		let isBypassFail=false
		if (message==="Bypass Failed!"){
			isBypassFail=true
		}

        elements.resultText.innerHTML = isLoading
            ? `<div class="flex justify-center items-center">
                   <div class="spinner-border animate-spin inline-block w-6 h-6 border-4 border-t-transparent border-white rounded-full"></div>
                   <span class="ml-4 text-lg font-semibold text-zinc-300">Verifying...</span>
               </div>`
            : message;

        elements.resultText.style.color = isBypassFail ? '#f87171' : '';
    };

	async function handleBypass() {
		const url = elements.urlInput.value.trim();
		if (!url) return alert('Please enter a URL to bypass.');

		updateUI(true);
		try {
            document.getElementById('bypassButton').disabled = true;

			turnstile.render(document.querySelector(".cfLoader"), {
				sitekey: '0x4AAAAAABADuz_ijBkxS1wM'
',
				callback: async function(token) {
					updateUI(false, `<div class="flex justify-center items-center">
										<div class="spinner-border animate-spin inline-block w-6 h-6 border-4 border-t-transparent border-white rounded-full"></div>
										<span class="ml-4 text-lg font-semibold text-zinc-300">Bypassing...</span>
									</div>`);

					try {
						const response = await fetch(`${API_ENDPOINT}?tk=${token}&url=${encodeURIComponent(url)}`);
						const data = await response.json();

						if (data.success) {
							const bypassedLink = data.result;
							updateUI(false, bypassedLink.length > 23 ? `${bypassedLink.substring(0, 23)}...` : bypassedLink, true);
							setupActionButtons(bypassedLink);
                            document.getElementById('bypassButton').disabled = false;
						} else {
							updateUI(false, `Bypass Failed!`);
                            document.getElementById('bypassButton').disabled = false;
						}
					} catch (error) {
						updateUI(false, `Bypass Failed!`);
                        document.getElementById('bypassButton').disabled = false;
					}
				},
				'error-callback': function(error) {
					turnstile.reset()
				}
			});
		} catch (error) {
			updateUI(false, `Bypass Failed!`);
			elements.copyButton.classList.add('hidden');
			elements.openButton.classList.add('hidden');
            document.getElementById('bypassButton').disabled = false;
		}
	}


    function setupActionButtons(bypassedLink) {
        elements.copyButton.onclick = async () => {
            try {
                await navigator.clipboard.writeText(bypassedLink);
                alert('URL copied to clipboard!');
            } catch {
                alert('Error copying URL.');
            }
        };

        elements.openButton.onclick = () => window.open(bypassedLink, '_blank');
    }

    elements.bypassButton.onclick = handleBypass;

    const preventDevTools = (e) => {
        const forbiddenKeys = [
            { key: 'F12' },
            { ctrlKey: true, shiftKey: true, key: 'I' },
            { ctrlKey: true, key: 'U' },
            { ctrlKey: true, shiftKey: true, key: 'J' }
        ];
        if (forbiddenKeys.some(combo => Object.entries(combo).every(([k, v]) => e[k] === v))) e.preventDefault();
    };

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', preventDevTools);
}

load();
