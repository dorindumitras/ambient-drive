"""Native StringId text resources; the HMI selects its locale, not a fixed app language."""
KEYS = 'enable none orange green blue manual electric hybrid battery waiting setup error'.split()
WORDS = {
'en': 'Enable automatic colors|No change|Orange|Green|Blue|Sequential / manual|eDrive / Electric|Hybrid|Battery control|Waiting for vehicle data|Vehicle setup required|Color change not confirmed',
'ro': 'Activare culori automate|Fără schimbare|Portocaliu|Verde|Albastru|Secvențial / manual|eDrive / Electric|Hibrid|Păstrare baterie|Așteaptă datele mașinii|Este necesară configurarea mașinii|Schimbarea culorii nu a fost confirmată',
'de': 'Automatische Farben aktivieren|Keine Änderung|Orange|Grün|Blau|Sequenziell / manuell|eDrive / Elektrisch|Hybrid|Batterieladung halten|Warten auf Fahrzeugdaten|Fahrzeugeinrichtung erforderlich|Farbwechsel nicht bestätigt',
'fr': 'Activer les couleurs automatiques|Aucun changement|Orange|Vert|Bleu|Séquentiel / manuel|eDrive / Électrique|Hybride|Maintien de charge|En attente des données du véhicule|Configuration du véhicule requise|Changement de couleur non confirmé',
'it': 'Attiva colori automatici|Nessuna modifica|Arancione|Verde|Blu|Sequenziale / manuale|eDrive / Elettrico|Ibrido|Mantieni carica|In attesa dei dati del veicolo|Configurazione del veicolo richiesta|Cambio colore non confermato',
'es': 'Activar colores automáticos|Sin cambios|Naranja|Verde|Azul|Secuencial / manual|eDrive / Eléctrico|Híbrido|Mantener carga|Esperando datos del vehículo|Se requiere configurar el vehículo|Cambio de color no confirmado',
'pt': 'Ativar cores automáticas|Sem alteração|Laranja|Verde|Azul|Sequencial / manual|eDrive / Elétrico|Híbrido|Manter carga|A aguardar dados do veículo|É necessário configurar o veículo|Alteração de cor não confirmada',
'nl': 'Automatische kleuren inschakelen|Geen wijziging|Oranje|Groen|Blauw|Sequentieel / handmatig|eDrive / Elektrisch|Hybride|Acculading behouden|Wachten op voertuiggegevens|Voertuiginstelling vereist|Kleurwijziging niet bevestigd',
'da': 'Aktivér automatiske farver|Ingen ændring|Orange|Grøn|Blå|Sekventiel / manuel|eDrive / Elektrisk|Hybrid|Bevar batteriopladning|Venter på bildata|Opsætning af bilen påkrævet|Farveskift ikke bekræftet',
'nb': 'Aktiver automatiske farger|Ingen endring|Oransje|Grønn|Blå|Sekvensiell / manuell|eDrive / Elektrisk|Hybrid|Behold batterilading|Venter på bildata|Bilen må konfigureres|Fargeendring ikke bekreftet',
'no': 'Aktiver automatiske farger|Ingen endring|Oransje|Grønn|Blå|Sekvensiell / manuell|eDrive / Elektrisk|Hybrid|Behold batterilading|Venter på bildata|Bilen må konfigureres|Fargeendring ikke bekreftet',
'sv': 'Aktivera automatiska färger|Ingen ändring|Orange|Grön|Blå|Sekventiell / manuell|eDrive / Elektrisk|Hybrid|Behåll batteriladdning|Väntar på fordonsdata|Fordonet måste konfigureras|Färgändringen inte bekräftad',
'fi': 'Ota automaattiset värit käyttöön|Ei muutosta|Oranssi|Vihreä|Sininen|Sekventiaalinen / manuaalinen|eDrive / Sähkö|Hybridi|Säilytä akun varaus|Odotetaan ajoneuvon tietoja|Ajoneuvon määritys vaaditaan|Värin vaihtoa ei vahvistettu',
'pl': 'Włącz automatyczne kolory|Bez zmian|Pomarańczowy|Zielony|Niebieski|Sekwencyjny / ręczny|eDrive / Elektryczny|Hybrydowy|Utrzymanie ładowania|Oczekiwanie na dane pojazdu|Wymagana konfiguracja pojazdu|Zmiana koloru niepotwierdzona',
'cs': 'Zapnout automatické barvy|Beze změny|Oranžová|Zelená|Modrá|Sekvenční / manuální|eDrive / Elektrický|Hybridní|Udržování nabití|Čekání na údaje vozidla|Je nutné nastavit vozidlo|Změna barvy nebyla potvrzena',
'sk': 'Zapnúť automatické farby|Bez zmeny|Oranžová|Zelená|Modrá|Sekvenčný / manuálny|eDrive / Elektrický|Hybridný|Udržiavanie nabitia|Čakanie na údaje vozidla|Vyžaduje sa nastavenie vozidla|Zmena farby nebola potvrdená',
'sl': 'Vklopi samodejne barve|Brez spremembe|Oranžna|Zelena|Modra|Sekvenčno / ročno|eDrive / Električno|Hibridno|Ohranjanje napolnjenosti|Čakanje na podatke vozila|Potrebna je nastavitev vozila|Sprememba barve ni potrjena',
'hu': 'Automatikus színek bekapcsolása|Nincs változtatás|Narancssárga|Zöld|Kék|Szekvenciális / kézi|eDrive / Elektromos|Hibrid|Töltöttség megőrzése|Várakozás a jármű adataira|A jármű beállítása szükséges|A színváltás nincs megerősítve',
'el': 'Ενεργοποίηση αυτόματων χρωμάτων|Χωρίς αλλαγή|Πορτοκαλί|Πράσινο|Μπλε|Σειριακό / χειροκίνητο|eDrive / Ηλεκτρικό|Υβριδικό|Διατήρηση φόρτισης|Αναμονή δεδομένων οχήματος|Απαιτείται ρύθμιση οχήματος|Η αλλαγή χρώματος δεν επιβεβαιώθηκε',
'ru': 'Включить автоматические цвета|Без изменений|Оранжевый|Зелёный|Синий|Последовательный / ручной|eDrive / Электрический|Гибридный|Сохранение заряда|Ожидание данных автомобиля|Требуется настройка автомобиля|Изменение цвета не подтверждено',
'uk': 'Увімкнути автоматичні кольори|Без змін|Помаранчевий|Зелений|Синій|Послідовний / ручний|eDrive / Електричний|Гібридний|Збереження заряду|Очікування даних автомобіля|Потрібне налаштування автомобіля|Зміну кольору не підтверджено',
'tr': 'Otomatik renkleri etkinleştir|Değişiklik yok|Turuncu|Yeşil|Mavi|Sıralı / manuel|eDrive / Elektrikli|Hibrit|Şarjı koru|Araç verileri bekleniyor|Araç yapılandırması gerekli|Renk değişikliği doğrulanmadı',
'ar': 'تفعيل الألوان التلقائية|بدون تغيير|برتقالي|أخضر|أزرق|تتابعي / يدوي|eDrive / كهربائي|هجين|الحفاظ على الشحن|بانتظار بيانات السيارة|يلزم إعداد السيارة|لم يتم تأكيد تغيير اللون',
'he': 'הפעלת צבעים אוטומטיים|ללא שינוי|כתום|ירוק|כחול|רציף / ידני|eDrive / חשמלי|היברידי|שמירת טעינה|ממתין לנתוני הרכב|נדרשת הגדרת הרכב|שינוי הצבע לא אושר',
'id': 'Aktifkan warna otomatis|Tanpa perubahan|Oranye|Hijau|Biru|Sekuensial / manual|eDrive / Listrik|Hibrida|Pertahankan daya baterai|Menunggu data kendaraan|Konfigurasi kendaraan diperlukan|Perubahan warna belum dikonfirmasi',
'vi': 'Bật màu tự động|Không thay đổi|Cam|Xanh lá|Xanh dương|Tuần tự / thủ công|eDrive / Chạy điện|Hybrid|Giữ mức pin|Đang chờ dữ liệu xe|Cần thiết lập xe|Chưa xác nhận thay đổi màu',
'th': 'เปิดใช้สีอัตโนมัติ|ไม่เปลี่ยนแปลง|สีส้ม|สีเขียว|สีน้ำเงิน|ซีเควนเชียล / แมนนวล|eDrive / ไฟฟ้า|ไฮบริด|รักษาระดับแบตเตอรี่|กำลังรอข้อมูลรถ|ต้องตั้งค่ารถ|ยังไม่ยืนยันการเปลี่ยนสี',
'ja': '自動カラーを有効にする|変更しない|オレンジ|グリーン|ブルー|シーケンシャル / マニュアル|eDrive / 電気走行|ハイブリッド|充電量を維持|車両データを待っています|車両の設定が必要です|色の変更を確認できません',
'ko': '자동 색상 활성화|변경 없음|주황색|녹색|파란색|시퀀셜 / 수동|eDrive / 전기|하이브리드|배터리 잔량 유지|차량 데이터 대기 중|차량 설정 필요|색상 변경이 확인되지 않음',
'zh_CN': '启用自动颜色|不改变|橙色|绿色|蓝色|顺序 / 手动|eDrive / 纯电动|混合动力|保持电量|等待车辆数据|需要设置车辆|未确认颜色变化',
'zh_TW': '啟用自動顏色|不變更|橙色|綠色|藍色|循序 / 手動|eDrive / 純電動|混合動力|保持電量|等待車輛資料|需要設定車輛|尚未確認顏色變更'
}

EXTRA_COLORS = {
    'en':'Bronze|White|Lilac','ro':'Bronz|Alb|Lila','de':'Bronze|Weiß|Flieder',
    'fr':'Bronze|Blanc|Lilas','it':'Bronzo|Bianco|Lilla','es':'Bronce|Blanco|Lila',
    'pt':'Bronze|Branco|Lilás','nl':'Brons|Wit|Lila','da':'Bronze|Hvid|Lilla',
    'nb':'Bronse|Hvit|Lilla','no':'Bronse|Hvit|Lilla','sv':'Brons|Vit|Lila',
    'fi':'Pronssi|Valkoinen|Lila','pl':'Brąz|Biały|Liliowy','cs':'Bronzová|Bílá|Šeříková',
    'sk':'Bronzová|Biela|Orgovánová','sl':'Bronasta|Bela|Lila','hu':'Bronz|Fehér|Lila',
    'el':'Μπρονζέ|Λευκό|Λιλά','ru':'Бронзовый|Белый|Сиреневый','uk':'Бронзовий|Білий|Бузковий',
    'tr':'Bronz|Beyaz|Lila','ar':'برونزي|أبيض|ليلكي','he':'ברונזה|לבן|לילך',
    'id':'Perunggu|Putih|Lila','vi':'Đồng|Trắng|Tím nhạt','th':'สีบรอนซ์|สีขาว|สีม่วงอ่อน',
    'ja':'ブロンズ|ホワイト|ライラック','ko':'브론즈|흰색|라일락',
    'zh_CN':'青铜色|白色|淡紫色','zh_TW':'青銅色|白色|淡紫色'
}
PALETTE = ['bronze','bronze_white','orange','orange_white','white','blue','blue_white','green','green_white','lilac','lilac_white']


def words(locale):
    values = WORDS.get(locale, WORDS.get(locale.split('_')[0], WORDS['en'])).split('|')
    assert len(values) == len(KEYS), locale
    result = dict(zip(KEYS, values))
    result['enable'] = 'Ambient Drive'
    result['none'] = 'STANDARD'
    result['manual'] = 'M/S'
    extra = EXTRA_COLORS.get(locale, EXTRA_COLORS.get(locale.split('_')[0], EXTRA_COLORS['en'])).split('|')
    result.update(zip(['bronze','white','lilac'],extra))
    for color in ['bronze','orange','blue','green','lilac']:
        result[color+'_white'] = result[color] + ('-' if locale.split('_')[0] == 'ro' else ' / ') + result['white']
    return result


def mode_name(mode, w):
    special = {'sport': 'Sport', 'sport_plus': 'Sport Plus', 'sport_individual': 'Sport Individual',
               'comfort': 'Comfort', 'adaptive': 'Adaptive', 'eco_pro': 'Eco Pro', 'eco_pro_individual': 'Eco Pro Individual',
               'manual': w['manual'], 'electric': w['electric'], 'electric_individual': w['electric'] + ' Individual',
               'hybrid': w['hybrid'], 'hybrid_eco': w['hybrid'] + ' Eco', 'hybrid_comfort': w['hybrid'] + ' Comfort',
               'battery_control': w['battery']}
    return special.get(mode, mode.replace('_', ' ').title().replace('Eco Pro', 'Eco Pro'))


UI_ERRORS = {
'en':'Unable to update the display','ro':'Interfața nu poate fi actualizată','de':'Anzeige kann nicht aktualisiert werden',
'fr':"Impossible d’actualiser l’affichage",'it':'Impossibile aggiornare la schermata','es':'No se puede actualizar la pantalla',
'pt':'Não é possível atualizar o ecrã','nl':'Weergave kan niet worden bijgewerkt','da':'Visningen kan ikke opdateres',
'nb':'Visningen kan ikke oppdateres','no':'Visningen kan ikke oppdateres','sv':'Visningen kan inte uppdateras',
'fi':'Näyttöä ei voi päivittää','pl':'Nie można odświeżyć ekranu','cs':'Zobrazení nelze aktualizovat',
'sk':'Zobrazenie sa nedá aktualizovať','sl':'Prikaza ni mogoče posodobiti','hu':'A kijelző nem frissíthető',
'el':'Δεν είναι δυνατή η ενημέρωση της οθόνης','ru':'Не удалось обновить экран','uk':'Не вдалося оновити екран',
'tr':'Ekran güncellenemiyor','ar':'تعذر تحديث الشاشة','he':'לא ניתן לעדכן את התצוגה','id':'Tampilan tidak dapat diperbarui',
'vi':'Không thể cập nhật màn hình','th':'ไม่สามารถอัปเดตหน้าจอได้','ja':'画面を更新できません','ko':'화면을 업데이트할 수 없습니다',
'zh_CN':'无法更新显示','zh_TW':'無法更新顯示'
}

def resources(app_id, modes, locale):
    w = words(locale)
    prefix = 'SID_' + app_id.upper() + '_'
    out = {prefix + 'ENABLED': w['enable'], prefix + 'MAIN_TITLE': 'Ambient Drive'}
    for mode in modes:
        out[prefix + 'MODE_' + mode.upper()] = mode_name(mode, w)
    for color in ['none'] + PALETTE:
        out['SID_AD_COLOR_' + color.upper()] = w[color]
    for phase in ['waiting', 'setup', 'error']:
        out['SID_AD_PHASE_' + phase.upper()] = w[phase]
    out['SID_AD_PHASE_UI_ERROR'] = UI_ERRORS.get(locale, UI_ERRORS.get(locale.split('_')[0], UI_ERRORS['en']))
    out['SID_AD_EMPTY'] = ''
    return out
