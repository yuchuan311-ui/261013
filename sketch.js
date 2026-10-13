// 宣告目前正在顯示的題目索引，零代表第一題。
let currentQuestion = 0;

// 宣告目前選取的選項索引，負一代表尚未作答。
let selectedOption = -1;

// 宣告目前題目是否已經完成作答。
let hasAnswered = false;

// 宣告使用者目前答對的題數。
let score = 0;

// 宣告測驗是否已經完成全部五題。
let quizFinished = false;

// 宣告觸控後暫時忽略瀏覽器模擬滑鼠事件的時間點。
let ignoreMouseUntil = 0;

// 宣告目前四個選項的可點擊區域集合。
let optionAreas = [];

// 宣告目前主要操作按鈕的可點擊區域。
let actionButtonArea = { x: 0, y: 0, width: 0, height: 0 };

// 宣告四個選項使用的英文字母標籤。
const optionLabels = ["A", "B", "C", "D"];

// 宣告答錯時正確選項所使用的指定背景顏色。
const correctAnswerColor = "#e9edc9";

// 宣告中文使用的 Google Fonts 字型名稱。
const chineseFont = "Noto Sans HK";

// 宣告英文與數字使用的 Google Fonts 字型名稱。
const latinFont = "Bitcount Ink";

// 宣告五題實際的 p5.js 簡易指令選擇題與四個選項。
const questions = [
  // 宣告第一題的資料內容。
  {
    // 設定第一題的中文題目文字。
    question: "在 p5.js 中，哪一個函式可以建立畫布？",
    // 設定第一題的四個選項文字。
    options: ["createCanvas()", "makeCanvas()", "newCanvas()", "canvasCreate()"],
    // 設定第一題的正確答案為 A 選項。
    answer: 0
  },

  // 宣告第二題的資料內容。
  {
    // 設定第二題的中文題目文字。
    question: "在 p5.js 中，哪一個函式只會在程式開始時執行一次？",
    // 設定第二題的四個選項文字。
    options: ["draw()", "loop()", "setup()", "start()"],
    // 設定第二題的正確答案為 C 選項。
    answer: 2
  },

  // 宣告第三題的資料內容。
  {
    // 設定第三題的中文題目文字。
    question: "在 p5.js 中，哪一個函式通常會持續重複執行？",
    // 設定第三題的四個選項文字。
    options: ["setup()", "draw()", "repeat()", "run()"],
    // 設定第三題的正確答案為 B 選項。
    answer: 1
  },

  // 宣告第四題的資料內容。
  {
    // 設定第四題的中文題目文字。
    question: "下列哪一個函式可以設定整個畫布的背景顏色？",
    // 設定第四題的四個選項文字。
    options: ["fill()", "stroke()", "background()", "canvasColor()"],
    // 設定第四題的正確答案為 C 選項。
    answer: 2
  },

  // 宣告第五題的資料內容。
  {
    // 設定第五題的中文題目文字。
    question: "在 p5.js 中，哪一個函式可以繪製橢圓或圓形？",
    // 設定第五題的四個選項文字。
    options: ["ellipse()", "rectangle()", "triangle()", "line()"],
    // 設定第五題的正確答案為 A 選項。
    answer: 0
  }
];

// 宣告 p5.js 初始化函式。
function setup() {
  // 建立符合瀏覽器視窗大小的全螢幕畫布。
  createCanvas(windowWidth, windowHeight);
  // 設定矩形從左上角開始繪製。
  rectMode(CORNER);
  // 設定文字預設採用左上角對齊，方便計算混合字型位置。
  textAlign(LEFT, TOP);
  // 設定線條端點為圓角，讓介面視覺較柔和。
  strokeCap(ROUND);
  // 設定畫布禁止瀏覽器預設觸控捲動與縮放手勢。
  canvas.elt.style.touchAction = "none";
  // 設定初始滑鼠游標為一般箭頭。
  cursor(ARROW);
  // 等待 Google Fonts 完成載入後要求畫面重新繪製。
  document.fonts.ready.then(function () {
    // 在字型準備完成後重新繪製畫布內容。
    redraw();
  });
}

// 宣告 p5.js 每一幀都會執行的主要繪圖函式。
function draw() {
  // 清除畫布並設定整體背景顏色。
  background("#f4f7f8");
  // 判斷測驗是否已經完成全部題目。
  if (quizFinished) {
    // 測驗完成時繪製結果畫面。
    drawResultScreen();
  } else {
    // 測驗進行中繪製題目、選項與操作按鈕。
    drawQuizScreen();
  }
  // 依照目前滑鼠所在位置更新游標樣式。
  updateCursorStyle();
}

// 宣告設定畫布文字字型、大小與粗細的共用函式。
function applyFont(fontFamily, fontSize, fontStyle) {
  // 設定目前要使用的字型家族。
  textFont(fontFamily);
  // 設定目前文字的字體大小。
  textSize(fontSize);
  // 設定目前文字的粗細樣式。
  textStyle(fontStyle);
}

// 宣告判斷字元是否屬於中文或中文常用標點的函式。
function isChineseCharacter(character) {
  // 使用 Unicode 範圍判斷漢字、中文標點與全形符號。
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF01-\uFF60]/.test(character);
}

// 宣告將文字拆成中文字型與英文數字字型連續片段的函式。
function splitTextByFont(content) {
  // 將輸入內容轉成可正確處理中文與特殊字元的陣列。
  const characters = Array.from(String(content));
  // 建立儲存字型片段的陣列。
  const runs = [];
  // 宣告目前正在累積的字型類型。
  let currentFontType = "";
  // 宣告目前正在累積的文字片段。
  let currentText = "";

  // 逐一檢查輸入文字的每一個字元。
  for (let index = 0; index < characters.length; index += 1) {
    // 取得目前正在處理的字元。
    const character = characters[index];
    // 判斷目前字元應該使用中文或英數字型。
    const fontType = isChineseCharacter(character) ? "chinese" : "latin";

    // 判斷字型類型是否與上一個字元不同。
    if (currentFontType !== "" && currentFontType !== fontType) {
      // 將上一段完整文字保存到片段陣列中。
      runs.push({ text: currentText, fontType: currentFontType });
      // 清空上一段文字，準備開始新的字型片段。
      currentText = "";
    }

    // 記錄目前字元所屬的字型類型。
    currentFontType = fontType;
    // 將目前字元加入正在組合的文字片段。
    currentText += character;
  }

  // 判斷最後是否仍有尚未保存的文字片段。
  if (currentText.length > 0) {
    // 將最後一段文字保存到片段陣列中。
    runs.push({ text: currentText, fontType: currentFontType });
  }

  // 回傳依照字型分類完成的文字片段。
  return runs;
}

// 宣告計算中英數混合文字總寬度的函式。
function getMixedTextWidth(content, fontSize, fontStyle) {
  // 依照字型需求拆分文字片段。
  const runs = splitTextByFont(content);
  // 宣告混合文字目前的總寬度。
  let totalWidth = 0;

  // 逐一計算每個字型片段的寬度。
  for (let index = 0; index < runs.length; index += 1) {
    // 取得目前文字片段資料。
    const run = runs[index];
    // 依照片段類型選擇中文或英文數字字型。
    const fontFamily = run.fontType === "chinese" ? chineseFont : latinFont;
    // 套用目前片段的字型設定。
    applyFont(fontFamily, fontSize, fontStyle);
    // 累加目前片段的實際寬度。
    totalWidth += textWidth(run.text);
  }

  // 回傳混合字型文字的總寬度。
  return totalWidth;
}

// 宣告從左上角繪製中英數混合字型文字的函式。
function drawMixedText(content, x, y, fontSize, fontStyle) {
  // 依照字型需求拆分文字片段。
  const runs = splitTextByFont(content);
  // 宣告目前繪製位置的水平座標。
  let drawX = x;

  // 逐一繪製每一個字型片段。
  for (let index = 0; index < runs.length; index += 1) {
    // 取得目前文字片段資料。
    const run = runs[index];
    // 依照片段類型選擇中文或英文數字字型。
    const fontFamily = run.fontType === "chinese" ? chineseFont : latinFont;
    // 套用目前片段的字型設定。
    applyFont(fontFamily, fontSize, fontStyle);
    // 從目前位置繪製文字片段。
    text(run.text, drawX, y);
    // 將下一段文字的起點移到目前片段的右側。
    drawX += textWidth(run.text);
  }
}

// 宣告以水平置中方式繪製中英數混合字型文字的函式。
function drawMixedCentered(content, centerX, centerY, fontSize, fontStyle) {
  // 計算混合文字完整寬度以取得置中的左側位置。
  const textWidthValue = getMixedTextWidth(content, fontSize, fontStyle);
  // 計算文字從左上角開始繪製時的水平起點。
  const startX = centerX - textWidthValue / 2;
  // 估算文字由左上角繪製時的垂直置中起點。
  const startY = centerY - fontSize * 0.52;
  // 使用分字型函式繪製置中的文字。
  drawMixedText(content, startX, startY, fontSize, fontStyle);
}

// 宣告依照中英數混合字型與可用寬度進行換行的函式。
function getWrappedLines(content, maxWidth, fontSize, fontStyle) {
  // 將內容轉成可逐字處理的字元陣列。
  const characters = Array.from(String(content));
  // 建立儲存每一行文字的陣列。
  const lines = [];
  // 宣告目前正在組合的文字行。
  let currentLine = "";

  // 逐一處理內容中的每個字元。
  for (let index = 0; index < characters.length; index += 1) {
    // 取得目前處理的字元。
    const character = characters[index];
    // 判斷目前字元是否為換行符號。
    if (character === "\n") {
      // 將目前文字行保存到結果中。
      lines.push(currentLine);
      // 清除目前文字行以開始下一行。
      currentLine = "";
      // 跳過本次迴圈剩餘內容並處理下一字元。
      continue;
    }
    // 建立加入目前字元後的測試文字。
    const testLine = currentLine + character;
    // 計算測試文字在混合字型下的寬度。
    const testWidth = getMixedTextWidth(testLine, fontSize, fontStyle);

    // 判斷測試文字是否超過可用寬度且目前行不是空白行。
    if (currentLine.length > 0 && testWidth > maxWidth) {
      // 將目前文字行保存到結果陣列。
      lines.push(currentLine);
      // 讓目前字元成為下一行的第一個字元。
      currentLine = character;
    } else {
      // 將測試文字保留為目前正在組合的文字行。
      currentLine = testLine;
    }
  }

  // 判斷最後一行是否有內容或整段內容為空字串。
  if (currentLine.length > 0 || lines.length === 0) {
    // 將最後一行加入結果陣列。
    lines.push(currentLine);
  }

  // 回傳換行後的文字行陣列。
  return lines;
}

// 宣告繪製多行中英數混合字型文字的函式。
function drawMixedLines(lines, x, y, lineHeight, fontSize, fontStyle) {
  // 逐一繪製每一行文字。
  for (let index = 0; index < lines.length; index += 1) {
    // 繪製目前索引的文字行。
    drawMixedText(lines[index], x, y + index * lineHeight, fontSize, fontStyle);
  }
}

// 宣告繪製測驗題目、四個選項與操作按鈕的函式。
function drawQuizScreen() {
  // 取得目前題目的資料。
  const quiz = questions[currentQuestion];
  // 計算響應式主要卡片寬度。
  const cardWidth = min(width - 20, 920);
  // 計算主要卡片的水平起點。
  const cardX = (width - cardWidth) / 2;
  // 設定主要卡片的上方位置。
  const cardY = 10;
  // 計算主要卡片可用高度。
  const cardHeight = max(0, height - 20);
  // 依照卡片寬度計算響應式內距。
  const padding = constrain(cardWidth * 0.055, 14, 38);
  // 計算卡片內容可用寬度。
  const contentWidth = cardWidth - padding * 2;

  // 設定卡片陰影顏色。
  drawingContext.shadowColor = "rgba(38, 70, 83, 0.16)";
  // 設定卡片陰影模糊程度。
  drawingContext.shadowBlur = 18;
  // 設定卡片陰影向下位移量。
  drawingContext.shadowOffsetY = 6;
  // 設定卡片填色為白色。
  fill("#ffffff");
  // 關閉卡片外框線。
  noStroke();
  // 繪製主要測驗卡片。
  rect(cardX, cardY, cardWidth, cardHeight, 18);
  // 清除卡片陰影顏色，避免影響後續圖形。
  drawingContext.shadowColor = "transparent";
  // 清除卡片陰影模糊設定。
  drawingContext.shadowBlur = 0;
  // 清除卡片陰影垂直位移設定。
  drawingContext.shadowOffsetY = 0;

  // 計算標題字型大小。
  const titleSize = constrain(cardWidth * 0.034, 20, 32);
  // 設定標題文字顏色。
  fill("#264653");
  // 繪製中英數混合的測驗標題。
  drawMixedText("p5.js 簡易指令測驗", cardX + padding, cardY + padding, titleSize, BOLD);

  // 計算進度文字字型大小。
  const progressSize = constrain(cardWidth * 0.018, 13, 18);
  // 設定進度文字顏色。
  fill("#52707a");
  // 繪製目前題數與總題數，中文與數字會分別套用指定字型。
  drawMixedText(`第 ${currentQuestion + 1} 題／共 ${questions.length} 題`, cardX + padding, cardY + padding + titleSize + 10, progressSize, NORMAL);

  // 計算進度條的水平位置。
  const progressX = cardX + padding;
  // 計算進度條的垂直位置。
  const progressY = cardY + padding + titleSize + progressSize + 28;
  // 設定進度條高度。
  const progressHeight = 8;
  // 設定進度條底色。
  fill("#e8eef0");
  // 繪製進度條底色。
  rect(progressX, progressY, contentWidth, progressHeight, 4);
  // 計算進度條完成比例。
  const progressRatio = (currentQuestion + (hasAnswered ? 1 : 0)) / questions.length;
  // 設定進度條完成色。
  fill("#2a9d8f");
  // 繪製進度條完成部分。
  rect(progressX, progressY, contentWidth * progressRatio, progressHeight, 4);

  // 計算題目文字字型大小。
  const questionFontSize = constrain(cardWidth * 0.025, 16, 25);
  // 計算題目文字行高。
  const questionLineHeight = questionFontSize * 1.35;
  // 取得依照卡片寬度換行後的題目文字。
  const questionLines = getWrappedLines(quiz.question, contentWidth - 28, questionFontSize, BOLD);
  // 計算題目區塊高度以容納所有題目行。
  const questionBoxHeight = max(64, questionLines.length * questionLineHeight + 24);
  // 計算題目區塊垂直起點。
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
  // 計算題目文字垂直置中起點。
  const questionTextY = questionY + (questionBoxHeight - questionLines.length * questionLineHeight) / 2;
  // 繪製目前題目的實際中文內容。
  drawMixedLines(questionLines, cardX + padding + 14, questionTextY, questionLineHeight, questionFontSize, BOLD);

  // 計算選項區域的起始垂直位置。
  const optionsTop = questionY + questionBoxHeight + 14;
  // 計算選項之間的響應式間距。
  const optionGap = constrain(cardWidth * 0.014, 6, 12);
  // 計算操作按鈕高度。
  const buttonHeight = constrain(cardWidth * 0.065, 44, 54);
  // 計算操作按鈕垂直位置。
  const buttonY = cardY + cardHeight - padding - buttonHeight;
  // 計算回饋文字預留高度。
  const feedbackSpace = hasAnswered ? 32 : 24;
  // 計算四個選項可以使用的總高度。
  const optionsAvailableHeight = buttonY - optionsTop - feedbackSpace - 10;
  // 計算單一選項高度並限制在合理的響應式範圍。
  const optionHeight = constrain((optionsAvailableHeight - optionGap * 3) / 4, 38, 78);
  // 清除上一幀留下的選項點擊區域。
  optionAreas = [];

  // 逐一繪製目前題目的四個選項。
  for (let index = 0; index < quiz.options.length; index += 1) {
    // 計算目前選項的垂直位置。
    const optionY = optionsTop + index * (optionHeight + optionGap);
    // 建立目前選項的可點擊範圍。
    const area = { x: cardX + padding, y: optionY, width: contentWidth, height: optionHeight };
    // 保存目前選項範圍供滑鼠與觸控事件使用。
    optionAreas.push(area);
    // 判斷目前選項是否為正確答案。
    const isCorrect = index === quiz.answer;
    // 判斷目前選項是否為使用者選取的答案。
    const isSelected = index === selectedOption;
    // 設定選項的預設背景色。
    let optionColor = "#f8fbfc";

    // 判斷測驗尚未作答且滑鼠目前位於此選項上。
    if (!hasAnswered && isPointInside(area, mouseX, mouseY)) {
      // 設定滑鼠移入選項的提示色。
      optionColor = "#e8f1f2";
    }
    // 判斷答對時使用者選取的選項是否為正確答案。
    if (hasAnswered && isSelected && isCorrect) {
      // 設定答對選項的淡綠色背景。
      optionColor = "#d8f3dc";
    }
    // 判斷答錯時使用者選取的選項是否為錯誤答案。
    if (hasAnswered && isSelected && !isCorrect) {
      // 設定使用者選錯選項的淡紅色背景。
      optionColor = "#ffd6d6";
    }
    // 判斷使用者答錯且目前選項為正確答案。
    if (hasAnswered && selectedOption !== quiz.answer && isCorrect) {
      // 將正確答案背景設定為指定的 #e9edc9 顏色。
      optionColor = correctAnswerColor;
    }

    // 套用目前選項的背景色。
    fill(optionColor);
    // 設定選項外框顏色。
    stroke("#d1e0e3");
    // 設定選項外框粗細。
    strokeWeight(1.5);
    // 繪製選項圓角矩形。
    rect(area.x, area.y, area.width, area.height, 11);
    // 關閉選項外框線。
    noStroke();

    // 計算選項字母圓形直徑。
    const labelDiameter = min(optionHeight * 0.58, 32);
    // 計算選項字母圓形左側位置。
    const labelX = area.x + 12;
    // 計算選項字母圓形上方位置。
    const labelY = area.y + (optionHeight - labelDiameter) / 2;
    // 判斷答錯時正確答案標籤是否也要使用較淺色。
    const correctLabelColor = hasAnswered && isCorrect && selectedOption !== quiz.answer ? "#a9b77b" : "#2a9d8f";
    // 設定選項字母圓形顏色。
    fill(correctLabelColor);
    // 繪製選項字母圓形。
    ellipse(labelX + labelDiameter / 2, labelY + labelDiameter / 2, labelDiameter, labelDiameter);
    // 設定選項字母文字顏色。
    fill("#ffffff");
    // 計算選項字母文字大小。
    const labelFontSize = constrain(labelDiameter * 0.46, 12, 16);
    // 以 Bitcount Ink 繪製英文選項標籤。
    drawMixedCentered(optionLabels[index], labelX + labelDiameter / 2, labelY + labelDiameter / 2, labelFontSize, BOLD);

    // 設定選項內容文字顏色。
    fill("#263238");
    // 計算選項內容文字大小。
    const optionFontSize = constrain(cardWidth * 0.019, 14, 19);
    // 取得選項內容依照寬度換行後的文字行。
    const optionLines = getWrappedLines(quiz.options[index], area.width - labelDiameter - 42, optionFontSize, NORMAL);
    // 計算選項內容行高。
    const optionLineHeight = optionFontSize * 1.25;
    // 計算選項內容的垂直起點。
    const optionTextY = area.y + (optionHeight - optionLines.length * optionLineHeight) / 2;
    // 繪製選項內容，英文與數字會使用 Bitcount Ink。
    drawMixedLines(optionLines, area.x + labelDiameter + 25, optionTextY, optionLineHeight, optionFontSize, NORMAL);
  }

  // 清除上一幀留下的主要按鈕點擊區域。
  actionButtonArea = { x: 0, y: 0, width: 0, height: 0 };
  // 設定回饋文字大小。
  const feedbackFontSize = constrain(cardWidth * 0.017, 13, 17);
  // 判斷目前題目是否已經作答。
  if (hasAnswered) {
    // 依照答題結果設定回饋文字顏色。
    fill(selectedOption === quiz.answer ? "#2d6a4f" : "#9b2226");
    // 建立答題結果回饋文字。
    const feedback = selectedOption === quiz.answer ? "答對了！" : `答錯了，正確答案是 ${optionLabels[quiz.answer]}。`;
    // 繪製答題結果回饋文字。
    drawMixedText(feedback, cardX + padding, buttonY - feedbackFontSize - 7, feedbackFontSize, NORMAL);
    // 建立下一題或查看結果按鈕的點擊區域。
    actionButtonArea = { x: cardX + padding, y: buttonY, width: contentWidth, height: buttonHeight };
    // 判斷目前是否為第五題。
    const isLastQuestion = currentQuestion === questions.length - 1;
    // 依照是否為最後一題設定按鈕文字。
    const actionLabel = isLastQuestion ? "查看測驗結果" : "下一題";
    // 繪製下一題或查看結果按鈕。
    drawActionButton(actionButtonArea, actionLabel);
  } else {
    // 設定尚未作答提示文字顏色。
    fill("#718096");
    // 繪製請選擇答案提示文字。
    drawMixedText("請點選一個答案", cardX + padding, buttonY - feedbackFontSize - 5, feedbackFontSize, NORMAL);
  }
}

// 宣告繪製測驗完成結果畫面的函式。
function drawResultScreen() {
  // 計算結果卡片寬度。
  const cardWidth = min(width - 20, 680);
  // 計算結果卡片高度並限制在可視範圍內。
  const cardHeight = min(max(350, height - 20), 560);
  // 計算結果卡片的水平起點。
  const cardX = (width - cardWidth) / 2;
  // 計算結果卡片的垂直起點。
  const cardY = max(10, (height - cardHeight) / 2);
  // 計算結果卡片內距。
  const padding = constrain(cardWidth * 0.08, 24, 52);

  // 設定結果卡片陰影顏色。
  drawingContext.shadowColor = "rgba(38, 70, 83, 0.16)";
  // 設定結果卡片陰影模糊程度。
  drawingContext.shadowBlur = 18;
  // 設定結果卡片陰影向下位移量。
  drawingContext.shadowOffsetY = 6;
  // 設定結果卡片填色。
  fill("#ffffff");
  // 關閉結果卡片外框線。
  noStroke();
  // 繪製結果卡片。
  rect(cardX, cardY, cardWidth, cardHeight, 18);
  // 清除結果卡片陰影顏色。
  drawingContext.shadowColor = "transparent";
  // 清除結果卡片陰影模糊設定。
  drawingContext.shadowBlur = 0;
  // 清除結果卡片陰影垂直位移設定。
  drawingContext.shadowOffsetY = 0;
  // 清除結果畫面不需要的選項點擊區域。
  optionAreas = [];
  // 設定結果標題文字顏色。
  fill("#264653");
  // 計算結果標題文字大小。
  const resultTitleSize = constrain(cardWidth * 0.06, 25, 42);
  // 繪製測驗完成標題。
  drawMixedCentered("測驗完成！", width / 2, cardY + padding + 28, resultTitleSize, BOLD);
  // 設定分數文字顏色。
  fill("#2a9d8f");
  // 計算分數文字大小。
  const scoreFontSize = constrain(cardWidth * 0.1, 42, 72);
  // 繪製由 Bitcount Ink 顯示的分數數字與總題數。
  drawMixedCentered(`${score}／${questions.length}`, width / 2, cardY + cardHeight * 0.45, scoreFontSize, BOLD);
  // 設定分數說明文字顏色。
  fill("#52707a");
  // 計算分數說明文字大小。
  const scoreLabelSize = constrain(cardWidth * 0.028, 16, 22);
  // 繪製答對題數說明文字。
  drawMixedCentered("答對題數", width / 2, cardY + cardHeight * 0.61, scoreLabelSize, NORMAL);
  // 計算重新開始按鈕寬度。
  const buttonWidth = min(cardWidth - padding * 2, 360);
  // 設定重新開始按鈕高度。
  const buttonHeight = 52;
  // 建立重新開始按鈕點擊範圍。
  actionButtonArea = { x: width / 2 - buttonWidth / 2, y: cardY + cardHeight - padding - buttonHeight, width: buttonWidth, height: buttonHeight };
  // 繪製重新開始測驗按鈕。
  drawActionButton(actionButtonArea, "重新開始測驗");
}

// 宣告繪製通用操作按鈕的函式。
function drawActionButton(area, label) {
  // 判斷滑鼠目前是否位於按鈕範圍內。
  const isHovered = isPointInside(area, mouseX, mouseY);
  // 依照滑鼠是否移入設定按鈕背景顏色。
  fill(isHovered ? "#21867a" : "#2a9d8f");
  // 關閉按鈕外框線。
  noStroke();
  // 繪製圓角操作按鈕。
  rect(area.x, area.y, area.width, area.height, 11);
  // 設定按鈕文字顏色。
  fill("#ffffff");
  // 計算按鈕文字大小。
  const buttonFontSize = constrain(area.width * 0.045, 16, 21);
  // 繪製置中的混合字型按鈕文字。
  drawMixedCentered(label, area.x + area.width / 2, area.y + area.height / 2, buttonFontSize, BOLD);
}

// 宣告判斷座標是否位於矩形區域內的函式。
function isPointInside(area, pointX, pointY) {
  // 回傳座標同時位於矩形水平與垂直範圍內的結果。
  return pointX >= area.x && pointX <= area.x + area.width && pointY >= area.y && pointY <= area.y + area.height;
}

// 宣告統一處理滑鼠與觸控點擊的函式。
function handlePointer(pointX, pointY) {
  // 判斷目前是否正在結果畫面。
  if (quizFinished) {
    // 判斷點擊位置是否位於重新開始按鈕內。
    if (isPointInside(actionButtonArea, pointX, pointY)) {
      // 執行重新開始測驗。
      restartQuiz();
    }
    // 結束結果畫面的點擊處理。
    return;
  }

  // 判斷目前題目是否已經完成作答。
  if (hasAnswered) {
    // 判斷點擊位置是否位於下一題或查看結果按鈕內。
    if (isPointInside(actionButtonArea, pointX, pointY)) {
      // 前往下一題或顯示測驗結果。
      goToNextQuestion();
    }
    // 結束已作答狀態的點擊處理。
    return;
  }

  // 逐一檢查四個選項的點擊範圍。
  for (let index = 0; index < optionAreas.length; index += 1) {
    // 判斷點擊位置是否位於目前選項內。
    if (isPointInside(optionAreas[index], pointX, pointY)) {
      // 記錄使用者選取的選項索引。
      selectedOption = index;
      // 將目前題目狀態設定為已作答。
      hasAnswered = true;
      // 判斷使用者所選答案是否正確。
      if (selectedOption === questions[currentQuestion].answer) {
        // 答對時增加一分。
        score += 1;
      }
      // 找到被點擊選項後停止檢查其他選項。
      break;
    }
  }
}

// 宣告滑鼠按下事件處理函式。
function mousePressed() {
  // 判斷是否需要忽略觸控後產生的模擬滑鼠事件。
  if (millis() < ignoreMouseUntil) {
    // 阻止瀏覽器執行滑鼠預設行為。
    return false;
  }
  // 使用目前滑鼠座標處理點擊操作。
  handlePointer(mouseX, mouseY);
  // 阻止瀏覽器執行預設點擊行為。
  return false;
}

// 宣告觸控開始事件處理函式。
function touchStarted() {
  // 判斷目前是否有可用的觸控點。
  if (touches.length > 0) {
    // 使用第一個觸控點座標處理操作。
    handlePointer(touches[0].x, touches[0].y);
    // 設定忽略後續模擬滑鼠事件的截止時間。
    ignoreMouseUntil = millis() + 600;
  }
  // 阻止瀏覽器執行觸控捲動行為。
  return false;
}

// 宣告瀏覽器視窗尺寸改變時的處理函式。
function windowResized() {
  // 將畫布重新調整為最新的視窗寬度與高度。
  resizeCanvas(windowWidth, windowHeight);
}

// 宣告依照目前可點擊區域更新滑鼠游標樣式的函式。
function updateCursorStyle() {
  // 宣告目前是否位於可點擊區域。
  let isClickable = false;
  // 判斷目前是否正在結果畫面。
  if (quizFinished) {
    // 結果畫面只有重新開始按鈕可以點擊。
    isClickable = isPointInside(actionButtonArea, mouseX, mouseY);
  } else if (hasAnswered) {
    // 已作答畫面只有下一題按鈕可以點擊。
    isClickable = isPointInside(actionButtonArea, mouseX, mouseY);
  } else {
    // 尚未作答時逐一檢查所有選項。
    for (let index = 0; index < optionAreas.length; index += 1) {
      // 判斷滑鼠是否位於目前選項內。
      if (isPointInside(optionAreas[index], mouseX, mouseY)) {
        // 將游標狀態設定為可點擊。
        isClickable = true;
        // 找到可點擊選項後停止檢查。
        break;
      }
    }
  }
  // 依照是否可點擊設定手指或箭頭游標。
  cursor(isClickable ? HAND : ARROW);
}

// 宣告前往下一題或顯示結果畫面的函式。
function goToNextQuestion() {
  // 判斷目前是否還有下一題。
  if (currentQuestion < questions.length - 1) {
    // 將目前題目索引增加一題。
    currentQuestion += 1;
    // 清除上一題的選項索引。
    selectedOption = -1;
    // 將下一題設定為尚未作答。
    hasAnswered = false;
  } else {
    // 完成第五題後切換至結果畫面。
    quizFinished = true;
  }
}

// 宣告重新開始整份測驗的函式。
function restartQuiz() {
  // 將目前題目索引重設為第一題。
  currentQuestion = 0;
  // 清除目前選取的選項索引。
  selectedOption = -1;
  // 將作答狀態重設為尚未作答。
  hasAnswered = false;
  // 將答對題數重設為零。
  score = 0;
  // 將測驗完成狀態重設為進行中。
  quizFinished = false;
}
