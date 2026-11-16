"""Short native Home-widget StringIds, selected by the iDrive locale."""
import native_locales

KEYS = 'ON OFF WAITING APPLYING UNCONFIRMED AMBIENT_OFF STANDARD COLOR_SET'.split()
TEXT = {
    'en': 'Active|Off|Waiting for data|Applying|Unconfirmed|Lights off|Keep current color|Configured color',
    'ro': 'Activ|Oprit|Așteaptă date|Se aplică|Neconfirmat|Lumini oprite|Păstrează culoarea|Culoare setată',
    'de': 'Aktiv|Aus|Warte auf Daten|Wird angewendet|Nicht bestätigt|Licht aus|Farbe beibehalten|Gewählte Farbe',
    'fr': 'Actif|Désactivé|Attente des données|Application|Non confirmé|Éclairage éteint|Conserver la couleur|Couleur choisie',
    'it': 'Attivo|Disattivato|Attesa dati|Applicazione|Non confermato|Luci spente|Mantieni colore|Colore impostato',
    'es': 'Activo|Desactivado|Esperando datos|Aplicando|Sin confirmar|Luces apagadas|Mantener color|Color elegido',
    'pt': 'Ativo|Desativado|A aguardar dados|A aplicar|Não confirmado|Luzes apagadas|Manter cor|Cor definida',
    'nl': 'Actief|Uit|Wachten op gegevens|Toepassen|Niet bevestigd|Verlichting uit|Kleur behouden|Ingestelde kleur',
    'da': 'Aktiv|Fra|Venter på data|Anvender|Ikke bekræftet|Lys slukket|Behold farven|Valgt farve',
    'nb': 'Aktiv|Av|Venter på data|Bruker fargen|Ikke bekreftet|Lys av|Behold fargen|Valgt farge',
    'no': 'Aktiv|Av|Venter på data|Bruker fargen|Ikke bekreftet|Lys av|Behold fargen|Valgt farge',
    'sv': 'Aktiv|Av|Väntar på data|Tillämpar|Inte bekräftat|Belysning av|Behåll färgen|Vald färg',
    'fi': 'Käytössä|Pois|Odotetaan tietoja|Otetaan käyttöön|Ei vahvistettu|Valot pois|Säilytä väri|Valittu väri',
    'pl': 'Aktywne|Wyłączone|Oczekiwanie na dane|Stosowanie|Niepotwierdzone|Światła wyłączone|Zachowaj kolor|Wybrany kolor',
    'cs': 'Aktivní|Vypnuto|Čekání na data|Používá se|Nepotvrzeno|Světla vypnuta|Ponechat barvu|Vybraná barva',
    'sk': 'Aktívne|Vypnuté|Čakanie na údaje|Používa sa|Nepotvrdené|Svetlá vypnuté|Ponechať farbu|Zvolená farba',
    'sl': 'Aktivno|Izklopljeno|Čakanje na podatke|Uveljavljanje|Nepotrjeno|Luči izklopljene|Ohrani barvo|Izbrana barva',
    'hu': 'Aktív|Kikapcsolva|Adatokra vár|Alkalmazás|Nincs megerősítve|Világítás kikapcsolva|Szín megtartása|Beállított szín',
    'el': 'Ενεργό|Ανενεργό|Αναμονή δεδομένων|Εφαρμογή|Μη επιβεβαιωμένο|Φώτα σβηστά|Διατήρηση χρώματος|Επιλεγμένο χρώμα',
    'ru': 'Активно|Выключено|Ожидание данных|Применение|Не подтверждено|Подсветка выключена|Сохранить цвет|Выбранный цвет',
    'uk': 'Активно|Вимкнено|Очікування даних|Застосування|Не підтверджено|Підсвітку вимкнено|Зберегти колір|Вибраний колір',
    'tr': 'Etkin|Kapalı|Veri bekleniyor|Uygulanıyor|Doğrulanmadı|Işıklar kapalı|Rengi koru|Seçilen renk',
    'ar': 'نشط|متوقف|بانتظار البيانات|جارٍ التطبيق|غير مؤكد|الإضاءة مطفأة|الاحتفاظ باللون|اللون المحدد',
    'he': 'פעיל|כבוי|ממתין לנתונים|מוחל|לא אושר|תאורה כבויה|שמירת הצבע|הצבע שנבחר',
    'id': 'Aktif|Nonaktif|Menunggu data|Menerapkan|Belum dikonfirmasi|Lampu mati|Pertahankan warna|Warna pilihan',
    'vi': 'Hoạt động|Tắt|Chờ dữ liệu|Đang áp dụng|Chưa xác nhận|Đèn tắt|Giữ nguyên màu|Màu đã chọn',
    'th': 'ทำงาน|ปิด|รอข้อมูล|กำลังใช้สี|ยังไม่ยืนยัน|ไฟปิด|คงสีเดิม|สีที่เลือก',
    'ja': '有効|無効|データ待機中|適用中|未確認|照明オフ|現在の色を維持|設定した色',
    'ko': '활성|꺼짐|데이터 대기 중|적용 중|확인되지 않음|조명 꺼짐|현재 색상 유지|설정한 색상',
    'zh_CN': '已启用|已关闭|等待数据|正在应用|尚未确认|灯光关闭|保持当前颜色|设定颜色',
    'zh_TW': '已啟用|已關閉|等待資料|正在套用|尚未確認|燈光關閉|保持目前顏色|設定顏色',
}


def resources(app_id, modes, locale):
    out = native_locales.resources(app_id, modes, locale)
    values = TEXT.get(locale, TEXT.get(locale.split('_')[0], TEXT['en'])).split('|')
    assert len(values) == len(KEYS), locale
    out.update({'SID_AD_WIDGET_' + key: value for key, value in zip(KEYS, values)})
    out['SID_AD_WIDGET_NO_DATA'] = '—'
    unavailable = {
        'en':'Service unavailable','ro':'Fără conexiune','de':'Keine Verbindung','fr':'Sans connexion',
        'it':'Non connesso','es':'Sin conexión','pt':'Sem ligação','nl':'Geen verbinding',
        'da':'Ingen forbindelse','nb':'Ingen forbindelse','no':'Ingen forbindelse','sv':'Ingen anslutning',
        'fi':'Ei yhteyttä','pl':'Brak połączenia','cs':'Bez připojení','sk':'Bez pripojenia',
        'sl':'Ni povezave','hu':'Nincs kapcsolat','el':'Χωρίς σύνδεση','ru':'Нет соединения',
        'uk':'Немає зв’язку','tr':'Bağlantı yok','ar':'غير متصل','he':'אין חיבור',
        'id':'Tidak terhubung','vi':'Không kết nối','th':'ไม่มีการเชื่อมต่อ',
        'ja':'接続なし','ko':'연결 없음','zh_CN':'未连接','zh_TW':'未連線',
    }
    out['SID_AD_WIDGET_UNAVAILABLE'] = unavailable.get(locale, unavailable.get(locale.split('_')[0], unavailable['en']))

    return out
