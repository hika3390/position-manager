import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// 特定のペア情報を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }
    
    const pair = await prisma.pair.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: true,
      },
    });
    
    if (!pair) {
      return NextResponse.json(
        { error: 'ペア情報が見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(pair);
  } catch (error) {
    console.error('ペア情報の取得に失敗しました:', error);
    return NextResponse.json(
      { error: 'ペア情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ペア情報を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }
    
    // ペア情報の存在確認
    const existingPair = await prisma.pair.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!existingPair) {
      return NextResponse.json(
        { error: 'ペア情報が見つかりません' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // バリデーション
    if (!data.name) {
      return NextResponse.json(
        { error: 'ペア名は必須です' },
        { status: 400 }
      );
    }
    
    // 数値フィールドのバリデーション
    const buyShares = parseInt(data.buyShares);
    const sellShares = parseInt(data.sellShares);
    const buyPrice = parseFloat(data.buyPrice);
    const sellPrice = parseFloat(data.sellPrice);
    
    if (isNaN(buyShares) || isNaN(sellShares) || isNaN(buyPrice) || isNaN(sellPrice)) {
      return NextResponse.json(
        { error: '株数と単価は数値で入力してください' },
        { status: 400 }
      );
    }
    
    const currentBuyPrice = data.currentBuyPrice ? parseFloat(data.currentBuyPrice) : existingPair.currentBuyPrice;
    const currentSellPrice = data.currentSellPrice ? parseFloat(data.currentSellPrice) : existingPair.currentSellPrice;
    let buyProfitLoss = existingPair.buyProfitLoss;
    let sellProfitLoss = existingPair.sellProfitLoss;
    let profitLoss = existingPair.profitLoss;

    if (existingPair.isSettled) {
      if (currentBuyPrice !== null && currentSellPrice !== null) {
        // 買いポジションの損益計算（現在価格 - 買い単価）× 株数
        buyProfitLoss = (currentBuyPrice - buyPrice) * buyShares;
        // 売りポジションの損益計算（売り単価 - 現在価格）× 株数
        sellProfitLoss = (sellPrice - currentSellPrice) * sellShares;
        // 総損益
        profitLoss = buyProfitLoss + sellProfitLoss;
      }
    }

    const updatedPair = await prisma.pair.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        link: data.link || null,
        analysisRecord: data.analysisRecord || null,
        buyShares,
        sellShares,
        buyPrice,
        sellPrice,
        buyStockCode: data.buyStockCode || null,
        sellStockCode: data.sellStockCode || null,
        currentBuyPrice,
        currentSellPrice,
        buyProfitLoss,
        sellProfitLoss,
        profitLoss,
      },
    });
    
    return NextResponse.json(updatedPair);
  } catch (error) {
    console.error('ペア情報の更新に失敗しました:', error);
    return NextResponse.json(
      { error: 'ペア情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// ペア情報を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }
    
    // ペア情報の存在確認
    const existingPair = await prisma.pair.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!existingPair) {
      return NextResponse.json(
        { error: 'ペア情報が見つかりません' },
        { status: 404 }
      );
    }
    
    await prisma.pair.delete({
      where: { id: parseInt(id) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ペア情報の削除に失敗しました:', error);
    return NextResponse.json(
      { error: 'ペア情報の削除に失敗しました' },
      { status: 500 }
    );
  }
}
