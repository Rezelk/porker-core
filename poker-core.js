/**
 * ポーカー
 * @namespace
 */
var poker = {};

/**
 * ポーカー・ハンド
 * @enum {number}
 */
poker.handCategory = {
  HIGH_CARD       :   0,
  ONE_PAIR        : 100,
  TWO_PAIR        : 200,
  THREE_OF_A_KIND : 300,
  STRAIGHT        : 400,
  FLUSH           : 500,
  FULL_HOUSE      : 600,
  FOUR_OF_A_KIND  : 700,
  STRAIGHT_FLUSH  : 800,
  ROYAL_FLUSH     : 900		// ROYAL_STRAIGHT_FLUSHじゃないと紛らわしい？
};


/**
 * コアライブラリ
 * @namespace
 */
poker.core = {};


/**
 * 役判定する。
 *
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns poker.handCategory のどれか。
 */
poker.core.getHandCategory = function(cards) {
	
	console.groupCollapsed("cards = " + poker.debug.toString(cards));
	
	// 数字  ：cards[].rank
	// スート：cards[].suit
	
	// カードをソートする
	var sortedCards = poker.core.getSortedCard(cards);
	console.info("sortedCards = " + poker.debug.toString(sortedCards));
	
	// 手札の状態を取得
	// ・ペア数
	// ・スリーオブアカインド（スリーカード）
	// ・フォーオブアカインド（フォーカード）
	// ・フラッシュ
	// ・ストレート
	// ・ロイヤルストレート（10, J, Q, K, A）
	var pairNum         = poker.core.getPairNum(sortedCards);
	var isThreeCard     = poker.core.containsThreeOfAKind(sortedCards);
	var isFourCard      = poker.core.isFourOfAKind(sortedCards);
	var isFlush         = poker.core.isFlush(sortedCards);
	var isStraght       = poker.core.isStraight(sortedCards);
	var isRoyalStraight = poker.core.isRoyalStraight(sortedCards);;
	
	console.info(" => ペア数:" + pairNum + ", スリー:" + isThreeCard + ", フォー:" + isFourCard + ", フラッシュ:" + isFlush + ", ロイヤル:" + isRoyalStraight);
	
	// どの組み合わせにも当てはまらないならば、ハイカードを返す。
	var hand = poker.handCategory.HIGH_CARD;
	
	// ロイヤルストレートフラッシュ
	if (isRoyalStraight && isFlush) {
		console.info("ロイヤルストレートフラッシュ");
		hand = poker.handCategory.ROYAL_FLUSH;
		
	// ストレートフラッシュ
	} else if (isStraght && isFlush) {
		console.info("ストレートフラッシュ");
		hand = poker.handCategory.STRAIGHT_FLUSH;
		
	// フォーオブアカインド
	} else if (isFourCard) {
		console.info("フォーオブアカインド");
		hand = poker.handCategory.FOUR_OF_A_KIND;
		
	// フルハウス
	} else if (pairNum === 1 && isThreeCard) {
		console.info("フルハウス");
		hand = poker.handCategory.FULL_HOUSE;
		
	// フラッシュ
	} else if (isFlush) {
		console.info("フラッシュ");
		hand = poker.handCategory.FLUSH;
		
	// ストレート
	} else if (isStraght) {
		console.info("ストレート");
		hand = poker.handCategory.STRAIGHT;
		
	// スリーオブアカインド
	} else if (isThreeCard) {
		console.info("スリーオブアカインド");
		hand = poker.handCategory.THREE_OF_A_KIND;
		
	// ツーペア
	} else if (pairNum === 2) {
		console.info("ツーペア");
		hand = poker.handCategory.TWO_PAIR;
		
	// ワンペア
	} else if (pairNum === 1) {
		console.info("ワンペア");
		hand = poker.handCategory.ONE_PAIR;	
	}
	
	console.groupEnd();
	
	return hand;
}


/**
 * 手札を降順ソートする。（数字のみでスートは考慮しない）
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns 降順ソートされた手札（A,K,Q,J,10,...,4,3,2）
 */
poker.core.getSortedCard = function(cards) {
	var pushedIndexes = [];
	var sortedCards = [];
	// ソートの便宜上A(=1)を最大値の14に置き換える
	for (var cardIdx = 0; cardIdx < cards.length; cardIdx++) {
		if (cards[cardIdx].rank === 1) {
			cards[cardIdx].rank = 14;
		}
	}
	// 全手札を処理
	for (var cardIdx = 0; cardIdx < cards.length; cardIdx++) {
		// 最大値のカードをソート結果の末尾にする
		var maxRank = 0;
		var maxRankIndex = 0;
		for (var targetIdx = 0; targetIdx < cards.length; targetIdx++) {
			// 処理済カードは処理対象外
			if (pushedIndexes.indexOf(targetIdx) !== -1) {
				continue;
			}
			if (maxRank < cards[targetIdx].rank) {
				maxRank = cards[targetIdx].rank;
				maxRankIndex = targetIdx;
			}
		}
		// 最大値のカードをソート結果にいれてカードを処理済にする
		sortedCards.push(cards[maxRankIndex]);
		pushedIndexes.push(maxRankIndex);
	}
	return sortedCards;
};

/**
 * ペア（同じ数字のカードが2枚）の数を取得する。
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns ペア数（スリーオブアカインド、フォーオブアカインドはペア数に含まない）
 */
poker.core.getPairNum = function(cards) {
	var checkedCardIndexes = [];
	var pairCount = 0;
	// 全手札を検索
	for (var cardIdx = 0; cardIdx < cards.length; cardIdx++) {
		// 処理済カードは検索対象外
		if (checkedCardIndexes.indexOf(cardIdx) !== -1) {
			continue;
		}
		// 処理済カードに追加
		checkedCardIndexes.push(cardIdx);
		// 同数字カードカウントを初期化（自身を含める）
		var sameCardCount = 1;
		// 組み合わせをチェックする
		for (var targetIdx = 0; targetIdx < cards.length; targetIdx++) {
			// 処理済カードは検索対象外
			if (checkedCardIndexes.indexOf(targetIdx) !== -1) {
				continue;
			}
			// 数字が一致したら同数字カードカウントを加算
			if (cards[cardIdx].rank === cards[targetIdx].rank) {
				// 処理済カードに追加
				checkedCardIndexes.push(targetIdx);
				sameCardCount++;
				console.debug("[getPairNum]([" + cardIdx + "]" + cards[cardIdx].rank + " <-> " + cards[targetIdx].rank + "[" + targetIdx + "]) 同カード" + sameCardCount + "枚目");
			}
		}
		if (sameCardCount === 2) {
			pairCount++;
		}
	}
	return pairCount;
};


/**
 * スリーオブアカインド（同じ数字のカードが3枚）の有無を取得する。
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns スリーオブアカインドを含む場合はtrue。
 */
poker.core.containsThreeOfAKind = function(cards) {
	var checkedCardIndexes = [];
	// 全手札を検索
	for (var cardIdx = 0; cardIdx < cards.length; cardIdx++) {
		// 処理済カードは検索対象外
		if (checkedCardIndexes.indexOf(cardIdx) !== -1) {
			continue;
		}
		// 処理済カードに追加
		checkedCardIndexes.push(cardIdx);
		// 同数字カードカウントを初期化（自身を含める）
		var sameCardCount = 1;
		// 組み合わせをチェックする
		for (var targetIdx = 0; targetIdx < cards.length; targetIdx++) {
			// 処理済カードは検索対象外
			if (checkedCardIndexes.indexOf(targetIdx) !== -1) {
				continue;
			}
			// 数字が一致したら同数字カードカウントを加算
			if (cards[cardIdx].rank === cards[targetIdx].rank) {
				// 処理済カードに追加
				checkedCardIndexes.push(targetIdx);
				sameCardCount++;
				console.debug("[containsThreeOfAKind]([" + cardIdx + "]" + cards[cardIdx].rank + " <-> " + cards[targetIdx].rank + "[" + targetIdx + "]) 同カード" + sameCardCount + "枚目");
			}
		}
		// 同数字カードカウントが3枚ならフォーオブアカインド
		if (sameCardCount === 3) {
			return true;
		}
	}
	return false;
};


/**
 * フォーオブアカインド（同じ数字のカードが4枚）の有無を取得する。
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns フォーオブアカインドの場合はtrue。
 */
poker.core.isFourOfAKind = function(cards) {
	var checkedCardIndexes = [];
	// 全手札を検索
	for (var cardIdx = 0; cardIdx < cards.length; cardIdx++) {
		// 処理済カードは検索対象外
		if (checkedCardIndexes.indexOf(cardIdx) !== -1) {
			continue;
		}
		// 処理済カードに追加
		checkedCardIndexes.push(cardIdx);
		// 同数字カードカウントを初期化（自身を含める）
		var sameCardCount = 1;
		// 組み合わせをチェックする
		for (var targetIdx = 0; targetIdx < cards.length; targetIdx++) {
			// 処理済カードは検索対象外
			if (checkedCardIndexes.indexOf(targetIdx) !== -1) {
				continue;
			}
			// 数字が一致したら同数字カードカウントを加算
			if (cards[cardIdx].rank === cards[targetIdx].rank) {
				// 処理済カードに追加
				checkedCardIndexes.push(targetIdx);
				sameCardCount++;
				console.debug("[isFourOfAKind]([" + cardIdx + "]" + cards[cardIdx].rank + " <-> " + cards[targetIdx].rank + "[" + targetIdx + "]) 同カード" + sameCardCount + "枚目");
			}
		}
		// 同数字カードカウントが4枚ならフォーオブアカインド
		if (sameCardCount === 4) {
			return true;
		}
	}
	return false;
};


/**
 * フラッシュ（スートがすべて一致）の有無を取得する。
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns フラッシュの場合はtrue。
 */
poker.core.isFlush = function(cards) {
	var checkedCardIndexes = [];
	// 全手札を検索
	for (var cardIdx = 0; cardIdx < cards.length; cardIdx++) {
		// 処理済カードは検索対象外
		if (checkedCardIndexes.indexOf(cardIdx) !== -1) {
			continue;
		}
		// 処理済カードに追加
		checkedCardIndexes.push(cardIdx);
		// 同記号カードカウントを初期化（自身を含める）
		var sameCardCount = 1;
		// 組み合わせをチェックする
		for (var targetIdx = 0; targetIdx < cards.length; targetIdx++) {
			// 処理済カードは検索対象外
			if (checkedCardIndexes.indexOf(targetIdx) !== -1) {
				continue;
			}
			// 記号が一致したら同記号カードカウントを加算
			if (cards[cardIdx].suit === cards[targetIdx].suit) {
				// 処理済カードに追加
				checkedCardIndexes.push(targetIdx);
				sameCardCount++;
				console.debug("[isFlush]([" + cardIdx + "]" + cards[cardIdx].suit + " <-> " + cards[targetIdx].suit + "[" + targetIdx + "]) 同カード" + sameCardCount + "枚目");
			}
		}
		// 同記号カードカウントが5枚ならフラッシュ
		if (sameCardCount === 5) {
			return true;
		}
	}
	return false;
};


/**
 * ストレート（カードが数字順になっている）の有無を取得する。
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns ストレートの場合はtrue。
 */
poker.core.isStraight = function(cards) {
	// 手札が5枚あることが前提
	if (cards.length !== 5) {
		return false;
	}
	// 5枚のカードが階段状に並んでいる場合はストレート（A,5,4,3,2)
	if (cards[0].rank === 14
	 && cards[1].rank === 5
	 && cards[2].rank === 4
	 && cards[3].rank === 3
	 && cards[4].rank === 2) {
	 	return true;
	// 5枚のカードが階段状に並んでいる場合はストレート（X,X-1,X-2,X-3,X-4）
	} else if (cards[1].rank === cards[0].rank - 1
	        && cards[2].rank === cards[0].rank - 2
	        && cards[3].rank === cards[0].rank - 3
	        && cards[4].rank === cards[0].rank - 4) {
	 	return true;
	}
	return false;
};


/**
 * ロイヤルストレート（ストレートかつカードがA,K,Q,J,10の組み合わせ）の有無を取得する。
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns ロイヤルストレートの場合はtrue。
 */
poker.core.isRoyalStraight = function(cards) {
	// 手札が5枚あることが前提
	if (cards.length !== 5) {
		return false;
	}
	// 5枚のカードがA,K,Q,J,10の場合はロイヤルストレート（役はない）
	if (cards[0].rank === 14
	 && cards[1].rank === 13
	 && cards[2].rank === 12
	 && cards[3].rank === 11
	 && cards[4].rank === 10) {
	 	return true;
	}
	return false;
};


/**
 * デバッグライブラリ
 * @namespace
 */
poker.debug = {};


/**
 * 手札を文字列に変換する。
 * @param {{rank:number, suit:string}[]} cards 手札。
 * @returns 手札を変換した文字列。
 */
poker.debug.toString = function(cards) {
	var string = "[";
	for (var cardIdx = 0; cardIdx < cards.length; cardIdx++) {
		string += "{rank:" + ("00" + cards[cardIdx].rank).slice(-2) + ",suit:'" + cards[cardIdx].suit + "'},";
	}
	string = string.slice(0,-1);
	string += "]";
	return string;
};
