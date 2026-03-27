const contractAddress = "0xccf05a523412F9aA75cD0fE9c11Dca6aAa7e57c2"; 
const abi = [
    "function playGame(uint256 side) public payable",
    "function lastResult(address) public view returns (bool)",
    "function hasPlayed(address) public view returns (bool)"
];

// ВЫНОСИМ ПЕРЕМЕННЫЕ НАВЕРХ (чтобы все функции их видели)
let contract;
let provider;
let signer; 

async function startApp() {
    const resultEl = document.getElementById("result");
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.BrowserProvider(window.ethereum);
            
            // ИНИЦИАЛИЗИРУЕМ ГЛОБАЛЬНУЮ ПЕРЕМЕННУЮ
            signer = await provider.getSigner(); 
            
            contract = new ethers.Contract(contractAddress, abi, signer);
            
            resultEl.innerText = "Приложение готово! Сделайте выбор.";
            console.log("App Ready. Аккаунт:", await signer.getAddress());
        } catch (error) {
            console.error("Доступ отклонен:", error);
            resultEl.innerText = "Ошибка подключения к MetaMask.";
        }
    } else {
        resultEl.innerText = "Установите MetaMask!";
    }
}

async function play(side) {
    const resultEl = document.getElementById("result");
    try {
        console.log("Ставка на:", side === 0 ? "Орел" : "Решка");
        
        // СТАВКА: 0.0001 tBNB (чуть больше, чтобы контракт точно сработал)
        const amountInWei = ethers.parseEther("0.0001"); 
        
        const tx = await contract.playGame(side, { 
            value: amountInWei,
            gasLimit: 100000 // Добавляем лимит газа на всякий случай
        });
        
        resultEl.innerHTML = '<span class="spinner"></span>Ждем подтверждения...';
        resultEl.className = "status-pending";
        
        await tx.wait(); 
        resultEl.innerText = "Ставка принята! Нажмите 'Узнать результат'.";
        resultEl.className = "";
    } catch (error) {
        console.error("Ошибка транзакции:", error);
        // Если контракт отклоняет (revert), скорее всего на нем нет денег
        resultEl.innerText = "Ошибка: Контракт отклонил ставку. Проверьте баланс контракта!";
        resultEl.className = "status-lose";
    }
}

async function getGamePlayed() {
    const resultEl = document.getElementById("result");
    try {
        const userAddress = await signer.getAddress();
        
        // 1. Проверяем, играл ли пользователь вообще
        const hasPlayed = await contract.hasPlayed(userAddress);
        
        if (hasPlayed) {
            // 2. Читаем результат напрямую из маппинга контракта
            const won = await contract.lastResult(userAddress);
            
            if (won) {
                resultEl.innerText = "ВЫ ВЫИГРАЛИ! 🎉";
                resultEl.className = "status-win";
            } else {
                resultEl.innerText = "ПРОИГРЫШ... 💀";
                resultEl.className = "status-lose";
            }
        } else {
            resultEl.innerText = "Вы еще не играли.";
        }
    } catch (error) {
        console.error("Ошибка чтения данных:", error);
        resultEl.innerText = "Ошибка связи с контрактом.";
    }
}

startApp();
