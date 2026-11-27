"use strict";
// ============================================================
// スプラトゥーン3 データ参照システム
//   1. ブキ参照システム   （/weapon）
//   2. ギア参照システム   （/gear）
//   3. ステージ参照システム（/stage）
// 3つのシステムは同じリソース名・同じページ遷移で操作できる（REST）
// データは変数（配列）に記録する
// 起動: node splatoon.js → http://localhost:8080/
// ============================================================
const express = require("express");
const app = express();

app.set('view engine', 'ejs');
app.use("/public", express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

// ===== 選択肢（フォームのプルダウンと並べ替えの順番に使う） =====
const WEAPON_TYPES = [ "シューター", "ローラー", "チャージャー", "スロッシャー", "スピナー",
  "マニューバー", "シェルター", "ブラスター", "フデ", "ストリンガー", "ワイパー" ];
const SUBS = [ "スプラッシュボム", "キューバンボム", "クイックボム", "カーリングボム", "ロボットボム",
  "タンサンボム", "トーピード", "スプラッシュシールド", "スプリンクラー", "ジャンプビーコン",
  "ポイントセンサー", "トラップ", "ポイズンミスト", "ラインマーカー" ];
const SPECIALS = [ "ウルトラショット", "グレートバリア", "ショクワンダー", "マルチミサイル",
  "メガホンレーザー5.1ch", "ジェットパック", "ウルトラハンコ", "カニタンク", "サメライド",
  "トリプルトルネード", "エナジースタンド", "キューインキ", "ホップソナー", "アメフラシ",
  "ナイスダマ", "デコイチラシ", "テイオウイカ", "ウルトラチャクチ", "スミナガシート" ];
const GEAR_PARTS = [ "アタマ", "フク", "クツ" ];
const BRANDS = [ "バトロイカ", "アイロニック", "クラーゲス", "ロッケンベルグ", "フォーリマ",
  "ホッコリー", "シグレニ", "アロメ", "ヤコ", "エゾッコ", "ホタックス", "ジモン", "アナアキ",
  "エンペリー", "タタキケンサキ", "バラズシ", "シチリン", "クマサン商会", "アタリメイド", "amiibo" ];
// ギアパワーはゲーム内の並び順で並べる（漢字を含むため五十音順にしない）
const ABILITIES = [ "インク効率アップ（メイン）", "インク効率アップ（サブ）", "インク回復力アップ",
  "ヒト移動速度アップ", "イカダッシュ速度アップ", "スペシャル増加量アップ", "スペシャル減少量ダウン",
  "スペシャル性能アップ", "復活時間短縮", "スーパージャンプ時間短縮", "サブ性能アップ",
  "相手インク影響軽減", "サブ影響軽減", "アクション強化", "スタートダッシュ", "ラストスパート",
  "逆境強化", "カムバック", "イカニンジャ", "リベンジ", "サーマルインク", "復活ペナルティアップ",
  "追加ギアパワー倍化", "ステルスジャンプ", "対物攻撃力アップ", "受け身術" ];
const ORIGINS = [ "スプラトゥーン3", "スプラトゥーン", "スプラトゥーン2" ];

// ===== データ（本来ならDBに置く） =====
let weapon = [
  { id:1,  name:"わかばシューター",     type:"シューター",   sub:"スプラッシュボム",     special:"グレートバリア" },
  { id:2,  name:"スプラシューター",     type:"シューター",   sub:"キューバンボム",       special:"ウルトラショット" },
  { id:3,  name:".52ガロン",            type:"シューター",   sub:"スプラッシュシールド", special:"メガホンレーザー5.1ch" },
  { id:4,  name:"N-ZAP85",              type:"シューター",   sub:"キューバンボム",       special:"エナジースタンド" },
  { id:5,  name:"プロモデラーMG",       type:"シューター",   sub:"タンサンボム",         special:"サメライド" },
  { id:6,  name:"スプラローラー",       type:"ローラー",     sub:"カーリングボム",       special:"グレートバリア" },
  { id:7,  name:"カーボンローラー",     type:"ローラー",     sub:"ロボットボム",         special:"ショクワンダー" },
  { id:8,  name:"スプラチャージャー",   type:"チャージャー", sub:"スプラッシュボム",     special:"キューインキ" },
  { id:9,  name:"リッター4K",           type:"チャージャー", sub:"トラップ",             special:"ホップソナー" },
  { id:10, name:"バケットスロッシャー", type:"スロッシャー", sub:"スプラッシュボム",     special:"トリプルトルネード" },
  { id:11, name:"ヒッセン",             type:"スロッシャー", sub:"ポイズンミスト",       special:"ジェットパック" },
  { id:12, name:"スプラスピナー",       type:"スピナー",     sub:"クイックボム",         special:"ウルトラハンコ" },
  { id:13, name:"スプラマニューバー",   type:"マニューバー", sub:"キューバンボム",       special:"カニタンク" },
  { id:14, name:"パラシェルター",       type:"シェルター",   sub:"スプリンクラー",       special:"トリプルトルネード" },
  { id:15, name:"ノヴァブラスター",     type:"ブラスター",   sub:"スプラッシュボム",     special:"ショクワンダー" },
  { id:16, name:"ホクサイ",             type:"フデ",         sub:"キューバンボム",       special:"ショクワンダー" },
  { id:17, name:"トライストリンガー",   type:"ストリンガー", sub:"ポイズンミスト",       special:"メガホンレーザー5.1ch" },
  { id:18, name:"ドライブワイパー",     type:"ワイパー",     sub:"トーピード",           special:"ウルトラハンコ" },
];

let gear = [
  { id:1,  name:"アンコウラバーマスク",     part:"アタマ", brand:"バトロイカ",     main:"インク効率アップ（メイン）" },
  { id:2,  name:"イカフィットメット",       part:"アタマ", brand:"アイロニック",   main:"アクション強化" },
  { id:3,  name:"2ラインメッシュ",          part:"アタマ", brand:"クラーゲス",     main:"スペシャル減少量ダウン" },
  { id:4,  name:"カモメッシュ",             part:"アタマ", brand:"ホッコリー",     main:"イカダッシュ速度アップ" },
  { id:5,  name:"ヤコバイザー",             part:"アタマ", brand:"ヤコ",           main:"スーパージャンプ時間短縮" },
  { id:6,  name:"8ビットフレーム",          part:"アタマ", brand:"エンペリー",     main:"スタートダッシュ" },
  { id:7,  name:"スイムキャップ",           part:"アタマ", brand:"シチリン",       main:"スペシャル性能アップ" },
  { id:8,  name:"アゲアゲコロモ",           part:"フク",   brand:"バトロイカ",     main:"スペシャル増加量アップ" },
  { id:9,  name:"3Dニットシャーク",         part:"フク",   brand:"クラーゲス",     main:"サーマルインク" },
  { id:10, name:"イカライダーBLACK",        part:"フク",   brand:"ロッケンベルグ", main:"サブ性能アップ" },
  { id:11, name:"F-010",                    part:"フク",   brand:"フォーリマ",     main:"リベンジ" },
  { id:12, name:"FCカラスミ",               part:"フク",   brand:"ヤコ",           main:"サブ影響軽減" },
  { id:13, name:"イカスカジャン",           part:"フク",   brand:"エゾッコ",       main:"復活時間短縮" },
  { id:14, name:"AGE262",                   part:"クツ",   brand:"バトロイカ",     main:"アクション強化" },
  { id:15, name:"LT90-3",                   part:"クツ",   brand:"アイロニック",   main:"インク効率アップ（サブ）" },
  { id:16, name:"イカスミチップ",           part:"クツ",   brand:"ロッケンベルグ", main:"復活時間短縮" },
  { id:17, name:"MOVEレッド",               part:"クツ",   brand:"アロメ",         main:"サブ性能アップ" },
  { id:18, name:"アカツキアローズ",         part:"クツ",   brand:"ヤコ",           main:"インク回復力アップ" },
  { id:19, name:"アナアキストラップレザー", part:"クツ",   brand:"アナアキ",       main:"対物攻撃力アップ" },
];

let stage = [
  { id:1,  name:"ユノハナ大渓谷",               origin:"スプラトゥーン3", added:"発売時",       feature:"自然の渓谷。中央の高台と金網が特徴" },
  { id:2,  name:"ゴンズイ地区",                 origin:"スプラトゥーン3", added:"発売時",       feature:"居住区。歩道橋と広い下層エリア" },
  { id:3,  name:"ヤガラ市場",                   origin:"スプラトゥーン3", added:"発売時",       feature:"埋立地の市場。サイドから裏取りしやすい" },
  { id:4,  name:"マテガイ放水路",               origin:"スプラトゥーン3", added:"発売時",       feature:"地下の放水路。入り組んだ地形と大きな柱" },
  { id:5,  name:"ナメロウ金属",                 origin:"スプラトゥーン3", added:"発売時",       feature:"工業地帯。トラックの足場と金網" },
  { id:6,  name:"マサバ海峡大橋",               origin:"スプラトゥーン",  added:"発売時",       feature:"ハイカラ地方とバンカラ地方を結ぶ縦長の橋" },
  { id:7,  name:"キンメダイ美術館",             origin:"スプラトゥーン",  added:"発売時",       feature:"美術館。回転するギミックがある" },
  { id:8,  name:"マヒマヒリゾート&スパ",        origin:"スプラトゥーン",  added:"発売時",       feature:"リゾートホテル。時間で足場が変化する" },
  { id:9,  name:"海女美術大学",                 origin:"スプラトゥーン2", added:"発売時",       feature:"美術大学。中央高台とルートの多さ" },
  { id:10, name:"チョウザメ造船",               origin:"スプラトゥーン2", added:"発売時",       feature:"タンカー上。時間で動く跳ね橋" },
  { id:11, name:"ザトウマーケット",             origin:"スプラトゥーン2", added:"発売時",       feature:"スーパーマーケット。凸凹した地形" },
  { id:12, name:"スメーシーワールド",           origin:"スプラトゥーン2", added:"発売時",       feature:"遊園地。動く床と壁" },
  { id:13, name:"クサヤ温泉",                   origin:"スプラトゥーン3", added:"シーズン2",    feature:"温泉街。長い坂道での駆け引き" },
  { id:14, name:"ヒラメが丘団地",               origin:"スプラトゥーン",  added:"シーズン2",    feature:"集合住宅。塗れる壁が多く立体的" },
  { id:15, name:"ナンプラー遺跡",               origin:"スプラトゥーン3", added:"シーズン3",    feature:"遺跡前のキャンプ。遮蔽物が多い" },
  { id:16, name:"マンタマリア号",               origin:"スプラトゥーン2", added:"シーズン3",    feature:"帆船。凸凹した地形と中央の柱" },
  { id:17, name:"タラポートショッピングパーク", origin:"スプラトゥーン3", added:"シーズン4",    feature:"大型商業施設。S字形のステージ" },
  { id:18, name:"コンブトラック",               origin:"スプラトゥーン2", added:"シーズン4",    feature:"BMXトラック。外周ルートと広い中央" },
  { id:19, name:"タカアシ経済特区",             origin:"スプラトゥーン3", added:"シーズン5",    feature:"建設中の高層ビル。縦断する大きな金網" },
  { id:20, name:"オヒョウ海運",                 origin:"スプラトゥーン3", added:"シーズン5",    feature:"海運。区切られていて戦況が分かりやすい" },
  { id:21, name:"バイガイ亭",                   origin:"スプラトゥーン3", added:"シーズン6",    feature:"ファミレス店内。中央が立体的に交差" },
  { id:22, name:"ネギトロ炭鉱",                 origin:"スプラトゥーン",  added:"シーズン6",    feature:"炭鉱跡。高い自陣とエレベーター" },
  { id:23, name:"カジキ空港",                   origin:"スプラトゥーン3", added:"シーズン7",    feature:"空港。プロペラを使った地形" },
];

// ===== 共通の処理 =====

// URLの :number が配列の番号として正しいか調べる．正しくなければ -1 を返す
function checkNumber( number, data ) {
  if( !/^[0-9]+$/.test( number ) ) return -1;
  const n = Number( number );
  if( n >= data.length ) return -1;
  return n;
}

// 番号が正しくないときのページ
function notFound( res, back, title ) {
  res.status(404).render('sp_error', { message: "指定されたデータは存在しません", back: back, title: title });
}

// 新しいIDは「今あるIDの最大値 + 1」にする（削除後にIDが重ならないように）
function newId( data ) {
  let max = 0;
  for( let row of data ) {
    if( row.id > max ) max = row.id;
  }
  return max + 1;
}

// 一覧の並べ替え
// 並べ替えても詳細ページのリンク先がずれないよう，元の配列の番号（index）を付けてから並べる
// order に選択肢の配列を渡すとその順番で，渡さなければ五十音順（localeCompare）で並べる
function sortList( data, key, order ) {
  let list = [];
  for( let i = 0; i < data.length; i++ ) {
    list.push( { index: i, row: data[i] } );
  }
  if( key ) {
    list.sort( (a, b) => {
      let result;
      if( order ) {
        let ia = order.indexOf( a.row[key] );
        let ib = order.indexOf( b.row[key] );
        if( ia < 0 ) ia = order.length;   // 選択肢にない値は最後へ
        if( ib < 0 ) ib = order.length;
        result = ia - ib;
      } else {
        result = String( a.row[key] ).localeCompare( String( b.row[key] ), 'ja' );
      }
      if( result == 0 ) result = a.row.id - b.row.id;   // 同じならID順
      return result;
    });
  }
  return list;
}

// トップページ
app.get("/", (req, res) => {
  res.render('sp_top', { weapon: weapon.length, gear: gear.length, stage: stage.length });
});

// ============================================================
// 1. ブキ参照システム
// ============================================================
// 並べ替えに使える項目と，その並び順
const WEAPON_SORT = { type: WEAPON_TYPES, sub: SUBS, special: SPECIALS };

// 一覧（?sort=type / sub / special で並べ替え）
app.get("/weapon", (req, res) => {
  let sort = req.query.sort;
  if( !( sort in WEAPON_SORT ) ) sort = "";
  const list = sortList( weapon, sort, WEAPON_SORT[sort] );
  res.render('weapon', { list: list, sort: sort });
});

// Create（新規登録フォーム）
app.get("/weapon/create", (req, res) => {
  res.render('weapon_new', { types: WEAPON_TYPES, subs: SUBS, specials: SPECIALS });
});

// Read（詳細）
app.get("/weapon/:number", (req, res) => {
  const number = checkNumber( req.params.number, weapon );
  if( number < 0 ) return notFound( res, "/weapon", "ブキ" );
  res.render('weapon_detail', { id: number, data: weapon[ number ] });
});

// Delete（削除）
app.get("/weapon/delete/:number", (req, res) => {
  const number = checkNumber( req.params.number, weapon );
  if( number < 0 ) return notFound( res, "/weapon", "ブキ" );
  weapon.splice( number, 1 );
  res.redirect('/weapon');
});

// Create（新規登録の処理）
app.post("/weapon", (req, res) => {
  weapon.push( {
    id: newId( weapon ),
    name: req.body.name,
    type: req.body.type,
    sub: req.body.sub,
    special: req.body.special,
  } );
  res.redirect('/weapon');
});

// Edit（編集フォーム）
app.get("/weapon/edit/:number", (req, res) => {
  const number = checkNumber( req.params.number, weapon );
  if( number < 0 ) return notFound( res, "/weapon", "ブキ" );
  res.render('weapon_edit', { id: number, data: weapon[ number ],
    types: WEAPON_TYPES, subs: SUBS, specials: SPECIALS });
});

// Update（更新の処理）
app.post("/weapon/update/:number", (req, res) => {
  const number = checkNumber( req.params.number, weapon );
  if( number < 0 ) return notFound( res, "/weapon", "ブキ" );
  weapon[ number ].name = req.body.name;
  weapon[ number ].type = req.body.type;
  weapon[ number ].sub = req.body.sub;
  weapon[ number ].special = req.body.special;
  res.redirect('/weapon/' + number);
});

// ============================================================
// 2. ギア参照システム
// ============================================================
const GEAR_SORT = { brand: null, main: ABILITIES };

// 一覧（?sort=brand / main で並べ替え）
app.get("/gear", (req, res) => {
  let sort = req.query.sort;
  if( !( sort in GEAR_SORT ) ) sort = "";
  const list = sortList( gear, sort, GEAR_SORT[sort] );
  res.render('gear', { list: list, sort: sort });
});

// Create（新規登録フォーム）
app.get("/gear/create", (req, res) => {
  res.render('gear_new', { parts: GEAR_PARTS, brands: BRANDS, abilities: ABILITIES });
});

// Read（詳細）
app.get("/gear/:number", (req, res) => {
  const number = checkNumber( req.params.number, gear );
  if( number < 0 ) return notFound( res, "/gear", "ギア" );
  res.render('gear_detail', { id: number, data: gear[ number ] });
});

// Delete（削除）
app.get("/gear/delete/:number", (req, res) => {
  const number = checkNumber( req.params.number, gear );
  if( number < 0 ) return notFound( res, "/gear", "ギア" );
  gear.splice( number, 1 );
  res.redirect('/gear');
});

// Create（新規登録の処理）
app.post("/gear", (req, res) => {
  gear.push( {
    id: newId( gear ),
    name: req.body.name,
    part: req.body.part,
    brand: req.body.brand,
    main: req.body.main,
  } );
  res.redirect('/gear');
});

// Edit（編集フォーム）
app.get("/gear/edit/:number", (req, res) => {
  const number = checkNumber( req.params.number, gear );
  if( number < 0 ) return notFound( res, "/gear", "ギア" );
  res.render('gear_edit', { id: number, data: gear[ number ],
    parts: GEAR_PARTS, brands: BRANDS, abilities: ABILITIES });
});

// Update（更新の処理）
app.post("/gear/update/:number", (req, res) => {
  const number = checkNumber( req.params.number, gear );
  if( number < 0 ) return notFound( res, "/gear", "ギア" );
  gear[ number ].name = req.body.name;
  gear[ number ].part = req.body.part;
  gear[ number ].brand = req.body.brand;
  gear[ number ].main = req.body.main;
  res.redirect('/gear/' + number);
});

// ============================================================
// 3. ステージ参照システム
// ============================================================
// 一覧
app.get("/stage", (req, res) => {
  const list = sortList( stage, "", null );
  res.render('stage', { list: list });
});

// Create（新規登録フォーム）
app.get("/stage/create", (req, res) => {
  res.render('stage_new', { origins: ORIGINS });
});

// Read（詳細）
app.get("/stage/:number", (req, res) => {
  const number = checkNumber( req.params.number, stage );
  if( number < 0 ) return notFound( res, "/stage", "ステージ" );
  res.render('stage_detail', { id: number, data: stage[ number ] });
});

// Delete（削除）
app.get("/stage/delete/:number", (req, res) => {
  const number = checkNumber( req.params.number, stage );
  if( number < 0 ) return notFound( res, "/stage", "ステージ" );
  stage.splice( number, 1 );
  res.redirect('/stage');
});

// Create（新規登録の処理）
app.post("/stage", (req, res) => {
  stage.push( {
    id: newId( stage ),
    name: req.body.name,
    origin: req.body.origin,
    added: req.body.added,
    feature: req.body.feature,
  } );
  res.redirect('/stage');
});

// Edit（編集フォーム）
app.get("/stage/edit/:number", (req, res) => {
  const number = checkNumber( req.params.number, stage );
  if( number < 0 ) return notFound( res, "/stage", "ステージ" );
  res.render('stage_edit', { id: number, data: stage[ number ], origins: ORIGINS });
});

// Update（更新の処理）
app.post("/stage/update/:number", (req, res) => {
  const number = checkNumber( req.params.number, stage );
  if( number < 0 ) return notFound( res, "/stage", "ステージ" );
  stage[ number ].name = req.body.name;
  stage[ number ].origin = req.body.origin;
  stage[ number ].added = req.body.added;
  stage[ number ].feature = req.body.feature;
  res.redirect('/stage/' + number);
});

app.listen(8080, () => console.log("Example app listening on port 8080!"));
