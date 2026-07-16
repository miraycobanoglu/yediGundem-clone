/*
 * 1. ÖĞLE VAKTİNE KALAN DAKİKAYI HESAPLAYAN SAYAÇ
 */
function updateCountdownToNoon() {
    const now = new Date();
    let noonTarget = new Date();
    noonTarget.setHours(13, 0, 0, 0);

    if (now > noonTarget) {
        noonTarget.setDate(noonTarget.getDate() + 1);
    }

    const diffMs = noonTarget - now;
    const totalMinutesRemaining = Math.floor(diffMs / 1000 / 60);

    const timeDurationEl = document.querySelector('.header__weather .time-duration');
    if (timeDurationEl) {
        timeDurationEl.innerText = `${totalMinutesRemaining} dakika`;
    }
}

/*
 * 2. TAM DİNAMİK HAVA DURUMU MOTORU 
 * Şehir isminden koordinat bulur, ardından güncel hava durumunu ve ikonunu basar.
 */
async function fetchLiveWeatherByCityName(cityName = "İstanbul") {
    try {
        // Şehir adından koordinatları (enlem/boylam) API ile dinamik olarak çekiyoruz
        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=tr&format=json`;
        const geoResponse = await fetch(geocodingUrl);
        if (!geoResponse.ok) throw new Error("Coğrafi veri alınamadı.");
        
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) {
            console.error(`${cityName} şehri API'de bulunamadı.`);
            return;
        }

        const { latitude, longitude } = geoData.results[0];

        // Bu koordinatlarla gerçek zamanlı hava durumunu sorguluyoruz
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=Europe%2FIstanbul`;
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) throw new Error("Hava durumu verisi alınamadı.");
        
        const weatherData = await weatherResponse.json();
        const currentTemp = Math.round(weatherData.current.temperature_2m);
        const wCode = weatherData.current.weather_code;

        // WMO kodlarına göre durum metni ve FontAwesome ikon sınıfı belirleme
        let desc = "Açık";
        let iconClass = "fa-sun";

        if (wCode >= 1 && wCode <= 3) {
            desc = "Parçalı Bulutlu";
            iconClass = "fa-cloud-sun";
        } else if (wCode >= 45 && wCode <= 48) {
            desc = "Sisli";
            iconClass = "fa-smog";
        } else if (wCode >= 51 && wCode <= 67) {
            desc = "Yağmurlu";
            iconClass = "fa-cloud-showers-heavy";
        } else if (wCode >= 71 && wCode <= 77) {
            desc = "Karlı";
            iconClass = "fa-snowflake";
        } else if (wCode >= 80 && wCode <= 82) {
            desc = "Sağanak Yağışlı";
            iconClass = "fa-cloud-showers";
        }

        //  HTML'deki elemanları seçip verileri basıyoruz
        const weatherSec = document.querySelector('.header__weather');
        if (weatherSec) {
            const degreeEl = weatherSec.querySelector('.degree');
            const descEl = weatherSec.querySelector('.description');
            const iconEl = weatherSec.querySelector('.weather-degree i');
            
            if (degreeEl) degreeEl.innerText = `${currentTemp}°`;
            if (descEl) descEl.innerText = desc;
            if (iconEl) iconEl.className = `fa-solid ${iconClass}`;
        }

        updateCountdownToNoon();

    } catch (error) {
        console.error("Hava durumu hatası:", error);
    }
}

/*
 * 3. ŞEHİR SEÇİM KUTUSU (SELECT) DİNLEYİCİSİ
 */
function initCitySelector() {
    const citySelectEl = document.querySelector('.location-select select');
    if (citySelectEl) {
        citySelectEl.addEventListener('change', (event) => {
            const selectedCityName = event.target.options[event.target.selectedIndex].text; 
            fetchLiveWeatherByWeatherCityName(selectedCityName);
        });
        return citySelectEl.options[citySelectEl.selectedIndex].text;
    }
    return "İstanbul";
}

// Seçim kutusu dinleyicisinde yukarıdaki doğru fonksiyon adını eşitlemek için küçük bir düzeltme wrapper'ı
function fetchLiveWeatherByWeatherCityName(name) {
    fetchLiveWeatherByCityName(name);
}

/*
 * 4. SİSTEM TARİHİNİ AYARLAMA VE GÜNÜ BAŞ HARFİ BÜYÜK DÖNDÜRME
 * JSON dosyasındaki "Pazartesi", "Salı" gibi büyük harfli yapıyla eşleşir.
 */
function initLiveDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateEl = document.querySelector('.tarih');
    if (dateEl) {
        dateEl.innerText = now.toLocaleDateString('tr-TR', options);
    }
    
    const rawDay = now.toLocaleDateString('tr-TR', { weekday: 'long' });
    return rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
}

/*
 * 5.JSON YAPINA GÖRE TÜM HABERLERİ BASAN TEK MOTOR
 */
function renderSiteContent(activeData) {
    if (!activeData) return;

    // --- ANA MANŞET ALANI (HERO NEWS) ---
    const heroLeft = document.querySelector('.hero__left');
    const heroCenter = document.querySelector('.hero__center');
    const heroRight = document.querySelector('.hero__right');

    // 1. Sol Kart (JSON: left)
    if (heroLeft && activeData.hero_news?.left) {
        const titleEl = heroLeft.querySelector('.news-card__title');
        const descDiv = heroLeft.querySelector('.news-card__desc');
        if (titleEl) titleEl.innerText = activeData.hero_news.left.title;
        if (descDiv) {
            // İçeriği temizleyip yeni gelen paragrafları ekliyoruz
            descDiv.innerHTML = '';
            if (activeData.hero_news.left.desc1) {
                descDiv.innerHTML += `<p>${activeData.hero_news.left.desc1}</p>`;
            }
            if (activeData.hero_news.left.desc2) {
                descDiv.innerHTML += `<p>${activeData.hero_news.left.desc2}</p>`;
            }
        }
    }

    // 2. Orta Kart - Resimli Ana Haber (JSON: center)
    if (heroCenter && activeData.hero_news?.center) {
        const titleEl = heroCenter.querySelector('.featured-news__title');
        const descEl = heroCenter.querySelector('.featured-news__desc');
        const imgEl = heroCenter.querySelector('.hero__image');
        
        if (titleEl) titleEl.innerText = activeData.hero_news.center.title;
        if (descEl) descEl.innerText = activeData.hero_news.center.desc || "";
        if (imgEl && activeData.hero_news.center.image) imgEl.src = activeData.hero_news.center.image;
    }

    // 3. Sağ Kart (JSON: right)
    if (heroRight && activeData.hero_news?.right) {
        const titleEl = heroRight.querySelector('.news-card__title');
        const descDiv = heroRight.querySelector('.news-card__desc');
        if (titleEl) titleEl.innerText = activeData.hero_news.right.title;
        if (descDiv) {
            descDiv.innerHTML = '';
            if (activeData.hero_news.right.desc1) {
                descDiv.innerHTML += `<p>${activeData.hero_news.right.desc1}</p>`;
            }
            if (activeData.hero_news.right.desc2) {
                descDiv.innerHTML += `<p>${activeData.hero_news.right.desc2}</p>`;
            }
        }
    }

    // --- KATEGORİLER ALANI (CATEGORIES) ---
    const categoryElements = document.querySelectorAll('.category__item'); 
    if (categoryElements.length > 0 && activeData.categories) {
        activeData.categories.forEach((cat, index) => {
            if (categoryElements[index]) {
                const titleEl = categoryElements[index].querySelector('.category__title');
                const textEl = categoryElements[index].querySelector('.category__text');
                if (titleEl) titleEl.innerText = cat.title;
                if (textEl) textEl.innerText = cat.text;
            }
        });
    }

    // --- ÖNE ÇIKANLAR / GÜNDEM (HIGHLIGHTS) ---
    const highlightsContainer = document.querySelector('.one-cikanlar-left__news');
    if (highlightsContainer && activeData.highlights) {
        highlightsContainer.innerHTML = ''; 
        activeData.highlights.forEach((high) => {
            const highlightHtml = `
                <div>
                    <h3>${high.title}</h3>
                    <p>${high.desc}</p>
                </div>
            `;
            highlightsContainer.insertAdjacentHTML('beforeend', highlightHtml);
        });
    }

    // --- EN ALT BÖLÜM (SECTION BOTTOM - TRUMP & GALATASARAY) ---
    const sectionBottom = document.querySelector('.section-bottom');
    if (sectionBottom && activeData.section_bottom) {
        // Trump Haberi (article)
        const articleBox = sectionBottom.querySelector('.section-bottom__article');
        if (articleBox && activeData.section_bottom.article) {
            const imgEl = articleBox.querySelector('img');
            const titleEl = articleBox.querySelector('.section-bottom__title');
            const descEl = articleBox.querySelector('.section-bottom__description');
            
            if (imgEl) imgEl.src = activeData.section_bottom.article.image;
            if (titleEl) titleEl.innerText = activeData.section_bottom.article.title;
            if (descEl) descEl.innerText = activeData.section_bottom.article.desc;
        }

        // Galatasaray Haberi (featured)
        const featuredBox = sectionBottom.querySelector('.section-bottom__featured');
        if (featuredBox && activeData.section_bottom.featured) {
            const imgEl = featuredBox.querySelector('.featured-img');
            const titleEl = featuredBox.querySelector('.featured-info h3');
            const descEl = featuredBox.querySelector('.featured-info p');
            
            if (imgEl) imgEl.src = activeData.section_bottom.featured.image;
            if (titleEl) titleEl.innerText = activeData.section_bottom.featured.title;
            if (descEl) descEl.innerText = activeData.section_bottom.featured.desc;
        }
    }

    // --- REKLAM / HEADER YAZILARI ---
    if (activeData.header) {
        const adTitle1El = document.querySelector('.news-title1');
        const adTitle2El = document.querySelector('.news-title2');
        const adLogoEl = document.querySelector('.news-logo');
        
        if (adTitle1El) adTitle1El.innerText = activeData.header.ad_title1;
        if (adTitle2El) adTitle2El.innerText = activeData.header.ad_title2;
        if (adLogoEl) adLogoEl.src = activeData.header.ad_logo;
    }
}

/*
 * 6. ANA SİSTEM BAŞLATICI
 */
async function initializeApp() {
    const currentDay = initLiveDate(); 
    const defaultCityName = initCitySelector();
    
    await fetchLiveWeatherByCityName(defaultCityName);
    setInterval(updateCountdownToNoon, 60000);

    try {
        const response = await fetch('./newsData.json');
        if (!response.ok) throw new Error("newsData.json bulunamadı.");
        const allData = await response.json();

        let todayData = allData[currentDay];

        if (todayData && todayData.copy_from) {
            const targetDay = todayData.copy_from; 
            todayData = allData[targetDay];
        }

        if (!todayData) {
            todayData = allData["Pazartesi"];
        }

        renderSiteContent(todayData);

    } catch (error) {
        console.error("Haberler yüklenirken hata:", error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);