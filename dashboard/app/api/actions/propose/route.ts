import { NextRequest, NextResponse } from 'next/server';

/**
 * Agent가 액션을 제안할 때 호출하는 엔드포인트
 * 액션 제안을 저장하고 ID를 반환
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, params, description, messageId, interactionId } = body;

    // 액션 제안 저장 (실제 환경에서는 DB에 저장)
    const proposalId = `PROPOSAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 여기서는 메모리에 저장 (실제 환경에서는 Redis나 DB 사용)
    // proposalStore[proposalId] = { action, params, description, messageId, interactionId };

    return NextResponse.json({
      proposalId,
      action,
      params,
      description,
      status: 'pending',
      message: '액션이 제안되었습니다. 사용자 승인을 기다립니다.'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

