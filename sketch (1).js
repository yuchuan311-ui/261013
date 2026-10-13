// 宣告目前在本次測驗中顯示的題目索引，零代表第一題。
let currentQuestion = 0;

// 宣告目前選取的選項索引，負一代表尚未作答。
let selectedOption = -1;

// 宣告目前題目是否已經完成作答。
let hasAnswered = false;

// 宣告目前測驗答對的題數。
let score = 0;

// 宣告本次測驗是否已經完成五題。
let quizFinished = false;

// 宣告從 CSV 成功讀取並驗證過的完整題庫。
let loadedQuestions = [];

// 宣告從完整題庫隨機抽出的本次五題題目。
let quizQuestions = [];

// 宣告 CSV 是否仍在載入中，初始狀態為 true。
let isLoadingQuestions = true;

// 宣告 CSV 是否載入失敗，初始狀態為 false。
let hasLoadError = false;

// 宣告載入失敗時要顯示給使用者的錯誤訊息。
let loadErrorMessage = "";

// 宣告觸控後暫時忽略瀏覽器模擬滑鼠事件的時間點。
let ignoreMouseUntil = 0;

// 宣告目前四個選項的可點擊區域集合。
let optionAreas = [];

// 宣告目前下一題、查看結果或重新開始按鈕的可點擊區域。
let actionButtonArea = { x: 0, y: 0, width: 0, height: 0 };

// 宣告四個選項使用的英文字母標籤。
const optionLabels = ["A", "B", "C", "D"];

// 宣告答錯時正確選項所使用的指定背景顏色。
const correctAnswerColor = "#e9edc9";

// 宣告中文內容使用的 Google Fonts 字型名稱。
const chineseFont = "Noto Sans HK";

// 宣告英文與數字內容使用的 Google Fonts 字型名稱。
const latinFont = "Bitcount Ink";

// 宣告本次測驗固定抽出的題目數量。
const quizSize = 5;

// 宣告 p5.js 初始化函式。
function setup() {
  // 建立符合瀏覽器視窗大小的全螢幕畫布。
  createCanvas(windowWidth, windowHeight);
  // 設定矩形從左上角開始繪製。
  rectMode(CORNER);
  // 設定文字從左上角開始繪製，方便計算混合字型位置。
  textAlign(LEFT, TOP);
  // 設定線條端點為圓角，讓介面視覺較柔和。
  strokeCap(ROUND);
  // 設定畫布停用瀏覽器預設觸控捲動與縮放手勢。
  canvas.elt.style.touchAction = "none";
  // 設定初始滑鼠游標為一般箭頭。
  cursor(ARROW);
  // 使用 p5.js loadTable 讀取同一資料夾內的 CSV 題庫。
  loadTable("questions.csv", "csv", "header", handleTableLoaded, handleTableLoadError);
  // 等待 Google Fonts 完成載入後要求畫面重新繪製。
  document.fonts.ready.then(function () {
    // 字型完成載入後重新繪製目前畫面。
    redraw();
  });
}

// 宣告 CSV 成功載入後的回呼函式。
function handleTableLoaded(table) {
  // 將載入狀態改為完成。
  isLoadingQuestions = false;
  // 先清空可能存在的舊題庫資料。
  loadedQuestions = [];
  // 逐列讀取 CSV 內容並轉成測驗題目物件。
  for (let rowIndex = 0; rowIndex < table.getRowCount(); rowIndex += 1) {
    // 取得目前資料列。
    const row = table.getRow(rowIndex);
    // 讀取 CSV 的 id 欄位並移除前後空白。
    const id = row.getString("id").trim();
    // 讀取 CSV 的 question 欄位並移除前後空白。
    const question = row.getString("question").trim();
    // 讀取 CSV 的 optionA 欄位並移除前後空白。
    const optionA = row.getString("optionA").trim();
    // 讀取 CSV 的 optionB 欄位並移除前後空白。
    const optionB = row.getString("optionB").trim();
    // 讀取 CSV 的 optionC 欄位並移除前後空白。
    const optionC = row.getString("optionC").trim();
    // 讀取 CSV 的 optionD 欄位並移除前後空白。
    const optionD = row.getString("optionD").trim();
    // 將答案欄位轉成大寫，方便驗證 A、B、C、D 格式。
    const answer = row.getString("answer").trim().toUpperCase();
    // 宣告允許的答案代號集合。
    const validAnswers = ["A", "B", "C", "D"];
    // 判斷資料列是否包含完整欄位與合法答案。
    const isValidRow = id !== "" && question !== "" && optionA !== "" && optionB !== "" && optionC !== "" && optionD !== "" && validAnswers.includes(answer);
    // 只有完整且合法的資料列才加入題庫。
    if (isValidRow) {
      // 將 CSV 資料列轉換成繪圖程式使用的題目格式。
      loadedQuestions.push({
        id: id,
        question: question,
        options: [optionA, optionB, optionC, optionD],
        answer: validAnswers.indexOf(answer)
      });
    }
  }
  // 判斷有效題目數是否足以抽出五題。
  if (loadedQuestions.length < quizSize) {
    // 將狀態設定為載入失敗，避免開始不完整的測驗。
    setQuestionLoadError(`題庫不足，目前只有 ${loadedQuestions.length} 題，至少需要 ${quizSize} 題。`);
    // 結束成功回呼函式。
    return;
  }
  // CSV 題庫完成後，才隨機抽出本次測驗題目。
  startNewQuiz();
}

// 宣告 CSV 載入失敗時的回呼函式。
function handleTableLoadError(error) {
  // 將載入狀態改為完成，讓 draw 可以顯示錯誤畫面。
  isLoadingQuestions = false;
  // 將錯誤狀態設定為 true。
  hasLoadError = true;
  // 將錯誤訊息整理成使用者容易理解的提示。
  loadErrorMessage = "找不到或無法讀取 questions.csv，請確認檔案與網頁位於同一資料夾。";
  // 將詳細錯誤輸出到瀏覽器主控台，方便除錯。
  console.error("questions.csv 載入失敗：", error);
}

// 宣告統一設定題庫錯誤狀態的函式。
function setQuestionLoadError(message) {
  // 將載入狀態改為完成。
  isLoadingQuestions = false;
  // 將錯誤狀態設定為 true。
  hasLoadError = true;
  // 保存要顯示的錯誤訊息。
  loadErrorMessage = message;
  // 將題目陣列清空，防止錯誤狀態誤用舊資料。
  quizQuestions = [];
}

// 宣告 p5.js 每一幀都會執行的主要繪圖函式。
function draw() {
  // 清除畫布並設定整體背景顏色。
  background("#f4f7f8");
  // 判斷題庫是否仍在載入中。
  if (isLoadingQuestions) {
    // 載入中時顯示載入狀態，不繪製測驗內容。
    drawLoadingScreen();
  // 判斷題庫是否載入失敗。
  } else if (hasLoadError) {
    // 載入失敗時顯示錯誤狀態，不繪製測驗內容。
    drawLoadErrorScreen();
  // 判斷測驗是否已經完成。
  } else if (quizFinished) {
    // 測驗完成時繪製結果畫面。
    drawResultScreen();
  } else {
    // 題庫成功載入且測驗進行中時繪製題目畫面。
    drawQuizScreen();
  }
  // 依照目前滑鼠所在位置更新游標樣式。
  updateCursorStyle();
}

// 宣告繪製題庫載入中狀態畫面的函式。
function drawLoadingScreen() {
  // 清除目前可點擊區域，避免載入中誤觸。
  optionAreas = [];
  // 清除目前操作按鈕區域，避免載入中誤觸。
  actionButtonArea = { x: 0, y: 0, width: 0, height: 0 };
  // 設定載入卡片寬度。
  const cardWidth = min(width - 32, 620);
  // 設定載入卡片高度。
  const cardHeight = min(max(250, height - 32), 330);
  // 計算載入卡片水平位置。
  const cardX = (width - cardWidth) / 2;
  // 計算載入卡片垂直位置。
  const cardY = (height - cardHeight) / 2;
  // 設定卡片陰影顏色。
  drawingContext.shadowColor = "rgba(38, 70, 83, 0.16)";
  // 設定卡片陰影模糊程度。
  drawingContext.shadowBlur = 18;
  // 設定卡片陰影垂直位移。
  drawingContext.shadowOffsetY = 6;
  // 設定卡片填色為白色。
  fill("#ffffff");
  // 關閉卡片外框。
  noStroke();
  // 繪製載入狀態卡片。
  rect(cardX, cardY, cardWidth, cardHeight, 18);
  // 清除卡片陰影設定，避免影響後續繪圖。
  clearShadow();
  // 設定標題文字顏色。
  fill("#264653");
  // 計算標題字型大小。
  const titleSize = constrain(cardWidth * 0.055, 24, 36);
  // 繪製載入標題。
  drawMixedCentered("p5.js 程式設計測驗", width / 2, cardY + cardHeight * 0.36, titleSize, BOLD);
  // 設定狀態文字顏色。
  fill("#52707a");
  // 計算狀態文字大小。
  const statusSize = constrain(cardWidth * 0.035, 17, 23);
  // 顯示題庫載入中訊息。
  drawMixedCentered("題庫載入中，請稍候⋯", width / 2, cardY + cardHeight * 0.62, statusSize, NORMAL);
}

// 宣告繪製題庫載入失敗狀態畫面的函式。
function drawLoadErrorScreen() {
  // 清除目前可點擊區域，避免錯誤畫面誤觸。
  optionAreas = [];
  // 清除目前操作按鈕區域，避免錯誤畫面誤觸。
  actionButtonArea = { x: 0, y: 0, width: 0, height: 0 };
  // 設定錯誤卡片寬度。
  const cardWidth = min(width - 32, 720);
  // 設定錯誤卡片高度。
  const cardHeight = min(max(290, height - 32), 410);
  // 計算錯誤卡片水平位置。
  const cardX = (width - cardWidth) / 2;
  // 計算錯誤卡片垂直位置。
  const cardY = (height - cardHeight) / 2;
  // 設定卡片陰影顏色。
  drawingContext.shadowColor = "rgba(38, 70, 83, 0.16)";
  // 設定卡片陰影模糊程度。
  drawingContext.shadowBlur = 18;
  // 設定卡片陰影垂直位移。
  drawingContext.shadowOffsetY = 6;
  // 設定卡片填色為白色。
  fill("#ffffff");
  // 關閉卡片外框。
  noStroke();
  // 繪製錯誤狀態卡片。
  rect(cardX, cardY, cardWidth, cardHeight, 18);
  // 清除卡片陰影設定，避免影響後續繪圖。
  clearShadow();
  // 設定錯誤標題顏色。
  fill("#9b2226");
  // 計算錯誤標題大小。
  const titleSize = constrain(cardWidth * 0.055, 24, 36);
  // 顯示題庫載入失敗標題。
  drawMixedCentered("題庫載入失敗", width / 2, cardY + cardHeight * 0.30, titleSize, BOLD);
  // 設定錯誤說明文字顏色。
  fill("#52616b");
  // 計算錯誤說明文字大小。
  const messageSize = constrain(cardWidth * 0.028, 15, 20);
  // 取得錯誤訊息的換行結果。
  const messageLines = getWrappedLines(loadErrorMessage, cardWidth - 72, messageSize, NORMAL);
  // 計算錯誤訊息行高。
  const lineHeight = messageSize * 1.45;
  // 計算錯誤訊息垂直起點。
  const messageY = cardY + cardHeight * 0.48;
  // 繪製錯誤訊息文字。
  drawMixedLines(messageLines, cardX + 36, messageY, lineHeight, messageSize, NORMAL);
  // 設定補充提示文字顏色。
  fill("#718096");
  // 顯示重新整理提示。
  drawMixedCentered("修正檔案後請重新整理網頁。", width / 2, cardY + cardHeight * 0.78, messageSize, NORMAL);
}

// 宣告使用 Fisher-Yates 演算法複製並隨機排序陣列的函式。
function shuffleArray(items) {
  // 建立原陣列的淺複製，避免改動完整題庫順序。
  const shuffled = items.slice();
  // 從陣列最後一個索引開始向前交換元素。
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    // 在目前索引以前產生包含端點的隨機索引。
    const randomIndex = floor(random(index + 1));
    // 暫存目前索引的題目。
    const temporary = shuffled[index];
    // 將隨機位置題目移到目前位置。
    shuffled[index] = shuffled[randomIndex];
    // 將暫存題目放入隨機位置。
    shuffled[randomIndex] = temporary;
  }
  // 回傳已可靠洗牌的陣列。
  return shuffled;
}

// 宣告從完整題庫開始一份新測驗的函式。
function startNewQuiz() {
  // 使用 Fisher-Yates 洗牌後取前五題，確保不是固定取前五筆。
  quizQuestions = shuffleArray(loadedQuestions).slice(0, quizSize);
  // 將目前題目索引重設為第一題。
  currentQuestion = 0;
  // 清除目前選取的選項。
  selectedOption = -1;
  // 將作答狀態重設為尚未作答。
  hasAnswered = false;
  // 將分數重設為零。
  score = 0;
  // 將完成狀態重設為尚未完成。
  quizFinished = false;
}

// 宣告設定畫布文字字型、大小與粗細的共用函式。
function applyFont(fontFamily, fontSize, fontStyle) {
  // 設定目前文字使用的字型家族。
  textFont(fontFamily);
  // 設定目前文字的大小。
  textSize(fontSize);
  // 設定目前文字的粗細樣式。
  textStyle(fontStyle);
}

// 宣告判斷字元是否屬於中文或中文常用標點的函式。
function isChineseCharacter(character) {
  // 使用 Unicode 範圍判斷漢字、中文標點與全形符號。
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF01-\uFF60]/.test(character);
}

// 宣告將文字拆成中文與英文數字字型連續片段的函式。
function splitTextByFont(content) {
  // 將內容轉成可以正確處理中文的字元陣列。
  const characters = Array.from(String(content));
  // 建立儲存字型片段的陣列。
  const runs = [];
  // 宣告目前片段的字型類型。
  let currentFontType = "";
  // 宣告目前正在累積的文字片段。
  let currentText = "";
  // 逐一處理每一個字元。
  for (let index = 0; index < characters.length; index += 1) {
    // 取得目前字元。
    const character = characters[index];
    // 中文與中文標點使用 Noto Sans HK，其餘使用 Bitcount Ink。
    const fontType = isChineseCharacter(character) ? "chinese" : "latin";
    // 判斷是否需要結束上一段字型片段。
    if (currentFontType !== "" && currentFontType !== fontType) {
      // 保存上一段文字與字型類型。
      runs.push({ text: currentText, fontType: currentFontType });
      // 清空上一段文字，準備累積新片段。
      currentText = "";
    }
    // 更新目前片段的字型類型。
    currentFontType = fontType;
    // 將目前字元加入文字片段。
    currentText += character;
  }
  // 判斷最後一段是否仍有文字。
  if (currentText.length > 0) {
    // 保存最後一段文字與字型類型。
    runs.push({ text: currentText, fontType: currentFontType });
  }
  // 回傳切分完成的字型片段。
  return runs;
}

// 宣告計算中英數混合文字寬度的函式。
function getMixedTextWidth(content, fontSize, fontStyle) {
  // 依照字型需求切分文字片段。
  const runs = splitTextByFont(content);
  // 宣告文字總寬度。
  let totalWidth = 0;
  // 逐一計算每個片段的寬度。
  for (let index = 0; index < runs.length; index += 1) {
    // 取得目前片段。
    const run = runs[index];
    // 依照片段類型選擇字型。
    const fontFamily = run.fontType === "chinese" ? chineseFont : latinFont;
    // 套用目前片段的字型設定。
    applyFont(fontFamily, fontSize, fontStyle);
    // 累加目前片段寬度。
    totalWidth += textWidth(run.text);
  }
  // 回傳混合字型的總寬度。
  return totalWidth;
}

// 宣告從左上角繪製中英數混合文字的函式。
function drawMixedText(content, x, y, fontSize, fontStyle) {
  // 依照字型需求切分文字片段。
  const runs = splitTextByFont(content);
  // 宣告目前繪製的水平位置。
  let drawX = x;
  // 逐一繪製每個字型片段。
  for (let index = 0; index < runs.length; index += 1) {
    // 取得目前片段。
    const run = runs[index];
    // 依照片段類型選擇字型。
    const fontFamily = run.fontType === "chinese" ? chineseFont : latinFont;
    // 套用目前片段的字型設定。
    applyFont(fontFamily, fontSize, fontStyle);
    // 從目前水平位置繪製文字。
    text(run.text, drawX, y);
    // 將下一段文字移到目前片段右側。
    drawX += textWidth(run.text);
  }
}

// 宣告水平與垂直置中繪製混合字型文字的函式。
function drawMixedCentered(content, centerX, centerY, fontSize, fontStyle) {
  // 計算完整混合文字寬度。
  const contentWidth = getMixedTextWidth(content, fontSize, fontStyle);
  // 計算左上角繪製起點。
  const startX = centerX - contentWidth / 2;
  // 使用近似字高計算垂直置中起點。
  const startY = centerY - fontSize * 0.52;
  // 從計算出的起點繪製文字。
  drawMixedText(content, startX, startY, fontSize, fontStyle);
}

// 宣告依照可用寬度切割混合字型文字的函式。
function getWrappedLines(content, maxWidth, fontSize, fontStyle) {
  // 將內容轉成逐字處理的字元陣列。
  const characters = Array.from(String(content));
  // 建立儲存各行文字的陣列。
  const lines = [];
  // 宣告目前正在組合的文字行。
  let currentLine = "";
  // 逐一處理每個字元。
  for (let index = 0; index < characters.length; index += 1) {
    // 取得目前字元。
    const character = characters[index];
    // 判斷目前字元是否是強制換行符號。
    if (character === "\n") {
      // 保存目前文字行。
      lines.push(currentLine);
      // 清空目前文字行。
      currentLine = "";
      // 直接處理下一個字元。
      continue;
    }
    // 建立加入目前字元後的測試文字。
    const testLine = currentLine + character;
    // 計算測試文字的實際混合字型寬度。
    const testWidth = getMixedTextWidth(testLine, fontSize, fontStyle);
    // 判斷加入字元後是否超過可用寬度。
    if (currentLine.length > 0 && testWidth > maxWidth) {
      // 保存目前行，不包含造成超寬的字元。
      lines.push(currentLine);
      // 以目前字元作為新行的開頭。
      currentLine = character;
    } else {
      // 將目前字元加入正在組合的文字行。
      currentLine = testLine;
    }
  }
  // 保存最後一行，或在空字串時建立一個空行。
  if (currentLine.length > 0 || lines.length === 0) {
    // 將最後一行加入結果陣列。
    lines.push(currentLine);
  }
  // 回傳換行後的文字行。
  return lines;
}

// 宣告依照行高繪製多行混合字型文字的函式。
function drawMixedLines(lines, x, y, lineHeight, fontSize, fontStyle) {
  // 逐行繪製文字內容。
  for (let index = 0; index < lines.length; index += 1) {
    // 繪製目前文字行。
    drawMixedText(lines[index], x, y + index * lineHeight, fontSize, fontStyle);
  }
}

// 宣告清除畫布陰影設定的函式。
function clearShadow() {
  // 將陰影顏色清為透明。
  drawingContext.shadowColor = "transparent";
  // 將陰影模糊程度歸零。
  drawingContext.shadowBlur = 0;
  // 將陰影垂直位移歸零。
  drawingContext.shadowOffsetY = 0;
}

// 宣告繪製測驗題目、選項與操作按鈕的函式。
function drawQuizScreen() {
  // 取得目前題目資料。
  const quiz = quizQuestions[currentQuestion];
  // 計算響應式主要卡片寬度。
  const cardWidth = min(width - 20, 920);
  // 計算主要卡片水平位置。
  const cardX = (width - cardWidth) / 2;
  // 設定主要卡片垂直位置。
  const cardY = 10;
  // 計算主要卡片高度。
  const cardHeight = max(0, height - 20);
  // 依照卡片寬度計算內距。
  const padding = constrain(cardWidth * 0.055, 14, 38);
  // 計算內容可用寬度。
  const contentWidth = cardWidth - padding * 2;
  // 繪製卡片陰影。
  drawingContext.shadowColor = "rgba(38, 70, 83, 0.16)";
  // 設定卡片陰影模糊程度。
  drawingContext.shadowBlur = 18;
  // 設定卡片陰影向下偏移。
  drawingContext.shadowOffsetY = 6;
  // 設定卡片填色。
  fill("#ffffff");
  // 關閉卡片外框線。
  noStroke();
  // 繪製測驗卡片。
  rect(cardX, cardY, cardWidth, cardHeight, 18);
  // 清除卡片陰影。
  clearShadow();
  // 計算標題字型大小。
  const titleSize = constrain(cardWidth * 0.034, 20, 32);
  // 設定標題文字顏色。
  fill("#264653");
  // 繪製測驗標題。
  drawMixedText("p5.js 程式設計簡易測驗", cardX + padding, cardY + padding, titleSize, BOLD);
  // 計算進度文字大小。
  const progressSize = constrain(cardWidth * 0.018, 13, 18);
  // 設定進度文字顏色。
  fill("#52707a");
  // 顯示目前題數與總題數。
  drawMixedText(`第 ${currentQuestion + 1} 題／共 ${quizQuestions.length} 題`, cardX + padding, cardY + padding + titleSize + 10, progressSize, NORMAL);
  // 計算進度條水平位置。
  const progressX = cardX + padding;
  // 計算進度條垂直位置。
  const progressY = cardY + padding + titleSize + progressSize + 28;
  // 設定進度條高度。
  const progressHeight = 8;
  // 設定進度條背景色。
  fill("#e8eef0");
  // 繪製進度條背景。
  rect(progressX, progressY, contentWidth, progressHeight, 4);
  // 計算目前進度比例。
  const progressRatio = (currentQuestion + (hasAnswered ? 1 : 0)) / quizQuestions.length;
  // 設定進度條完成色。
  fill("#2a9d8f");
  // 繪製進度條完成部分。
  rect(progressX, progressY, contentWidth * progressRatio, progressHeight, 4);
  // 計算題目字型大小。
  const questionFontSize = constrain(cardWidth * 0.025, 16, 25);
  // 計算題目行高。
  const questionLineHeight = questionFontSize * 1.35;
  // 取得題目換行結果。
  const questionLines = getWrappedLines(quiz.question, contentWidth - 28, questionFontSize, BOLD);
  // 計算題目區塊高度。
  const questionBoxHeight = max(64, questionLines.length * questionLineHeight + 24);
  // 計算題目區塊垂直位置。
  const questionY = progressY + progressHeight + 18;
  // 設定題目區塊背景色。
  fill("#e7f1f2");
  // 設定題目區塊外框色。
  stroke("#b7d6d8");
  // 設定題目區塊外框粗細。
  strokeWeight(1.5);
  // 繪製題目區塊。
  rect(cardX + padding, questionY, contentWidth, questionBoxHeight, 12);
  // 關閉題目區塊外框線。
  noStroke();
  // 設定題目文字顏色。
  fill("#1f2933");
  // 計算題目文字垂直起點。
  const questionTextY = questionY + (questionBoxHeight - questionLines.length * questionLineHeight) / 2;
  // 繪製題目文字。
  drawMixedLines(questionLines, cardX + padding + 14, questionTextY, questionLineHeight, questionFontSize, BOLD);
  // 計算選項起始垂直位置。
  const optionsTop = questionY + questionBoxHeight + 14;
  // 計算選項間距。
  const optionGap = constrain(cardWidth * 0.014, 6, 12);
  // 計算操作按鈕高度。
  const buttonHeight = constrain(cardWidth * 0.065, 44, 54);
  // 計算操作按鈕垂直位置。
  const buttonY = cardY + cardHeight - padding - buttonHeight;
  // 計算回饋文字保留高度。
  const feedbackSpace = hasAnswered ? 32 : 24;
  // 計算選項可使用總高度。
  const optionsAvailableHeight = max(152, buttonY - optionsTop - feedbackSpace - 10);
  // 計算單一選項高度，讓小螢幕也能維持四個選項。
  const optionHeight = constrain((optionsAvailableHeight - optionGap * 3) / 4, 32, 78);
  // 清除上一幀的選項點擊區域。
  optionAreas = [];
  // 逐一繪製四個選項。
  for (let index = 0; index < quiz.options.length; index += 1) {
    // 計算目前選項的垂直位置。
    const optionY = optionsTop + index * (optionHeight + optionGap);
    // 建立目前選項的點擊區域。
    const area = { x: cardX + padding, y: optionY, width: contentWidth, height: optionHeight };
    // 保存選項點擊區域。
    optionAreas.push(area);
    // 判斷目前選項是否為正確答案。
    const isCorrect = index === quiz.answer;
    // 判斷目前選項是否是使用者選取的答案。
    const isSelected = index === selectedOption;
    // 設定選項預設背景顏色。
    let optionColor = "#f8fbfc";
    // 尚未作答且滑鼠移入時顯示提示色。
    if (!hasAnswered && isPointInside(area, mouseX, mouseY)) {
      // 設定滑鼠移入背景色。
      optionColor = "#e8f1f2";
    }
    // 答對時將使用者選取的正確答案標示為淡綠色。
    if (hasAnswered && isSelected && isCorrect) {
      // 設定答對選項背景色。
      optionColor = "#d8f3dc";
    }
    // 答錯時將使用者選取的錯誤答案標示為淡紅色。
    if (hasAnswered && isSelected && !isCorrect) {
      // 設定答錯選項背景色。
      optionColor = "#ffd6d6";
    }
    // 答錯時將正確選項標示為指定的 #e9edc9。
    if (hasAnswered && selectedOption !== quiz.answer && isCorrect) {
      // 套用指定的正確答案背景色。
      optionColor = correctAnswerColor;
    }
    // 套用目前選項背景色。
    fill(optionColor);
    // 設定選項外框色。
    stroke("#d1e0e3");
    // 設定選項外框粗細。
    strokeWeight(1.5);
    // 繪製選項圓角矩形。
    rect(area.x, area.y, area.width, area.height, 11);
    // 關閉選項外框線。
    noStroke();
    // 計算選項字母圓形直徑。
    const labelDiameter = min(optionHeight * 0.58, 32);
    // 計算字母圓形水平位置。
    const labelX = area.x + 12;
    // 計算字母圓形垂直位置。
    const labelY = area.y + (optionHeight - labelDiameter) / 2;
    // 判斷答錯時正確答案標籤是否需要變淡。
    const labelColor = hasAnswered && isCorrect && selectedOption !== quiz.answer ? "#a9b77b" : "#2a9d8f";
    // 設定字母圓形背景色。
    fill(labelColor);
    // 繪製字母圓形。
    ellipse(labelX + labelDiameter / 2, labelY + labelDiameter / 2, labelDiameter, labelDiameter);
    // 設定字母文字顏色。
    fill("#ffffff");
    // 計算字母文字大小。
    const labelFontSize = constrain(labelDiameter * 0.46, 11, 16);
    // 使用 Bitcount Ink 繪製選項字母。
    drawMixedCentered(optionLabels[index], labelX + labelDiameter / 2, labelY + labelDiameter / 2, labelFontSize, BOLD);
    // 設定選項內容文字顏色。
    fill("#263238");
    // 計算選項內容文字大小。
    const optionFontSize = constrain(cardWidth * 0.019, 14, 19);
    // 取得選項內容換行結果。
    const optionLines = getWrappedLines(quiz.options[index], area.width - labelDiameter - 42, optionFontSize, NORMAL);
    // 計算選項內容行高。
    const optionLineHeight = optionFontSize * 1.25;
    // 計算選項內容垂直起點。
    const optionTextY = area.y + (optionHeight - optionLines.length * optionLineHeight) / 2;
    // 繪製選項內容文字。
    drawMixedLines(optionLines, area.x + labelDiameter + 25, optionTextY, optionLineHeight, optionFontSize, NORMAL);
  }
  // 清除上一幀的按鈕點擊區域。
  actionButtonArea = { x: 0, y: 0, width: 0, height: 0 };
  // 設定回饋文字大小。
  const feedbackFontSize = constrain(cardWidth * 0.017, 13, 17);
  // 判斷目前題目是否已經作答。
  if (hasAnswered) {
    // 依答題結果設定回饋文字顏色。
    fill(selectedOption === quiz.answer ? "#2d6a4f" : "#9b2226");
    // 建立答題回饋文字。
    const feedback = selectedOption === quiz.answer ? "答對了！" : `答錯了，正確答案是 ${optionLabels[quiz.answer]}。`;
    // 繪製答題回饋文字。
    drawMixedText(feedback, cardX + padding, buttonY - feedbackFontSize - 7, feedbackFontSize, NORMAL);
    // 建立操作按鈕點擊區域。
    actionButtonArea = { x: cardX + padding, y: buttonY, width: contentWidth, height: buttonHeight };
    // 判斷是否已經是本次測驗最後一題。
    const isLastQuestion = currentQuestion === quizQuestions.length - 1;
    // 設定最後一題或一般題目的按鈕文字。
    const actionLabel = isLastQuestion ? "查看測驗結果" : "下一題";
    // 繪製操作按鈕。
    drawActionButton(actionButtonArea, actionLabel);
  } else {
    // 設定尚未作答提示文字顏色。
    fill("#718096");
    // 顯示請選擇答案提示。
    drawMixedText("請點選一個答案", cardX + padding, buttonY - feedbackFontSize - 5, feedbackFontSize, NORMAL);
  }
}

// 宣告繪製測驗結果畫面的函式。
function drawResultScreen() {
  // 計算結果卡片寬度。
  const cardWidth = min(width - 20, 680);
  // 計算結果卡片高度。
  const cardHeight = min(max(350, height - 20), 560);
  // 計算結果卡片水平位置。
  const cardX = (width - cardWidth) / 2;
  // 計算結果卡片垂直位置。
  const cardY = max(10, (height - cardHeight) / 2);
  // 計算結果卡片內距。
  const padding = constrain(cardWidth * 0.08, 24, 52);
  // 設定結果卡片陰影。
  drawingContext.shadowColor = "rgba(38, 70, 83, 0.16)";
  // 設定結果卡片陰影模糊程度。
  drawingContext.shadowBlur = 18;
  // 設定結果卡片陰影向下位移。
  drawingContext.shadowOffsetY = 6;
  // 設定結果卡片填色。
  fill("#ffffff");
  // 關閉結果卡片外框。
  noStroke();
  // 繪製結果卡片。
  rect(cardX, cardY, cardWidth, cardHeight, 18);
  // 清除卡片陰影。
  clearShadow();
  // 清除結果頁不需要的選項區域。
  optionAreas = [];
  // 設定結果標題文字顏色。
  fill("#264653");
  // 計算結果標題大小。
  const resultTitleSize = constrain(cardWidth * 0.06, 25, 42);
  // 繪製測驗完成標題。
  drawMixedCentered("測驗完成！", width / 2, cardY + padding + 28, resultTitleSize, BOLD);
  // 設定分數文字顏色。
  fill("#2a9d8f");
  // 計算分數文字大小。
  const scoreFontSize = constrain(cardWidth * 0.1, 42, 72);
  // 顯示答對題數與五題總數。
  drawMixedCentered(`${score}／${quizQuestions.length}`, width / 2, cardY + cardHeight * 0.45, scoreFontSize, BOLD);
  // 設定分數說明文字顏色。
  fill("#52707a");
  // 計算分數說明文字大小。
  const scoreLabelSize = constrain(cardWidth * 0.028, 16, 22);
  // 顯示答對題數說明。
  drawMixedCentered("答對題數", width / 2, cardY + cardHeight * 0.61, scoreLabelSize, NORMAL);
  // 計算重新開始按鈕寬度。
  const buttonWidth = min(cardWidth - padding * 2, 360);
  // 設定重新開始按鈕高度。
  const buttonHeight = 52;
  // 建立重新開始按鈕點擊區域。
  actionButtonArea = { x: width / 2 - buttonWidth / 2, y: cardY + cardHeight - padding - buttonHeight, width: buttonWidth, height: buttonHeight };
  // 繪製重新開始測驗按鈕。
  drawActionButton(actionButtonArea, "重新開始測驗");
}

// 宣告繪製通用操作按鈕的函式。
function drawActionButton(area, label) {
  // 判斷滑鼠是否位於按鈕內。
  const isHovered = isPointInside(area, mouseX, mouseY);
  // 依滑鼠是否移入選擇按鈕顏色。
  fill(isHovered ? "#21867a" : "#2a9d8f");
  // 關閉按鈕外框。
  noStroke();
  // 繪製圓角操作按鈕。
  rect(area.x, area.y, area.width, area.height, 11);
  // 設定按鈕文字顏色。
  fill("#ffffff");
  // 計算按鈕文字大小。
  const buttonFontSize = constrain(area.width * 0.045, 16, 21);
  // 置中繪製按鈕文字。
  drawMixedCentered(label, area.x + area.width / 2, area.y + area.height / 2, buttonFontSize, BOLD);
}

// 宣告判斷座標是否位於矩形區域內的函式。
function isPointInside(area, pointX, pointY) {
  // 回傳座標是否同時位於矩形水平與垂直範圍內。
  return pointX >= area.x && pointX <= area.x + area.width && pointY >= area.y && pointY <= area.y + area.height;
}

// 宣告統一處理滑鼠與觸控點擊的函式。
function handlePointer(pointX, pointY) {
  // 載入中或載入失敗時不接受任何操作。
  if (isLoadingQuestions || hasLoadError) {
    // 直接結束函式，避免空資料造成錯誤。
    return;
  }
  // 判斷目前是否在結果畫面。
  if (quizFinished) {
    // 判斷點擊是否位於重新開始按鈕。
    if (isPointInside(actionButtonArea, pointX, pointY)) {
      // 重新隨機抽出五題並開始測驗。
      startNewQuiz();
    }
    // 結束結果畫面的點擊處理。
    return;
  }
  // 判斷目前題目是否已經作答。
  if (hasAnswered) {
    // 判斷點擊是否位於下一題或查看結果按鈕。
    if (isPointInside(actionButtonArea, pointX, pointY)) {
      // 前往下一題或顯示結果。
      goToNextQuestion();
    }
    // 結束已作答畫面的點擊處理。
    return;
  }
  // 逐一檢查四個選項的點擊區域。
  for (let index = 0; index < optionAreas.length; index += 1) {
    // 判斷點擊位置是否在目前選項內。
    if (isPointInside(optionAreas[index], pointX, pointY)) {
      // 記錄使用者選取的選項索引。
      selectedOption = index;
      // 將目前題目設為已作答。
      hasAnswered = true;
      // 判斷使用者是否選到正確答案。
      if (selectedOption === quizQuestions[currentQuestion].answer) {
        // 答對時增加一分。
        score += 1;
      }
      // 找到選項後停止檢查。
      break;
    }
  }
}

// 宣告滑鼠按下事件處理函式。
function mousePressed() {
  // 判斷是否需要忽略觸控後產生的模擬滑鼠事件。
  if (millis() < ignoreMouseUntil) {
    // 阻止瀏覽器執行預設滑鼠行為。
    return false;
  }
  // 使用目前滑鼠座標處理點擊。
  handlePointer(mouseX, mouseY);
  // 阻止瀏覽器執行預設行為。
  return false;
}

// 宣告觸控開始事件處理函式。
function touchStarted() {
  // 判斷目前是否存在觸控點。
  if (touches.length > 0) {
    // 使用第一個觸控點處理使用者操作。
    handlePointer(touches[0].x, touches[0].y);
    // 設定忽略後續模擬滑鼠事件的截止時間。
    ignoreMouseUntil = millis() + 600;
  }
  // 阻止瀏覽器執行觸控捲動。
  return false;
}

// 宣告瀏覽器視窗尺寸改變時的處理函式。
function windowResized() {
  // 將畫布調整為最新的瀏覽器視窗大小。
  resizeCanvas(windowWidth, windowHeight);
}

// 宣告依照目前可點擊區域更新滑鼠游標的函式。
function updateCursorStyle() {
  // 宣告目前是否位於可點擊區域。
  let isClickable = false;
  // 載入中或載入失敗時保持一般箭頭游標。
  if (isLoadingQuestions || hasLoadError) {
    // 保持不可點擊的游標狀態。
    isClickable = false;
  // 結果畫面只允許重新開始按鈕被點擊。
  } else if (quizFinished) {
    // 判斷滑鼠是否位於重新開始按鈕。
    isClickable = isPointInside(actionButtonArea, mouseX, mouseY);
  // 已作答畫面只允許操作下一題按鈕。
  } else if (hasAnswered) {
    // 判斷滑鼠是否位於下一題按鈕。
    isClickable = isPointInside(actionButtonArea, mouseX, mouseY);
  // 尚未作答畫面允許點擊四個選項。
  } else {
    // 逐一檢查滑鼠是否位於選項內。
    for (let index = 0; index < optionAreas.length; index += 1) {
      // 判斷滑鼠是否位於目前選項。
      if (isPointInside(optionAreas[index], mouseX, mouseY)) {
        // 將游標設定為可點擊狀態。
        isClickable = true;
        // 找到可點擊選項後停止檢查。
        break;
      }
    }
  }
  // 依照可點擊狀態設定手指或箭頭游標。
  cursor(isClickable ? HAND : ARROW);
}

// 宣告前往下一題或顯示測驗結果的函式。
function goToNextQuestion() {
  // 判斷目前是否還有下一題。
  if (currentQuestion < quizQuestions.length - 1) {
    // 將題目索引往後移動一題。
    currentQuestion += 1;
    // 清除上一題選取的選項。
    selectedOption = -1;
    // 將新題目設為尚未作答。
    hasAnswered = false;
  } else {
    // 完成第五題後切換至結果畫面。
    quizFinished = true;
  }
}
