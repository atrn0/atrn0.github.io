# 『低レイヤを知りたい人のための C コンパイラ作成入門』勉強ノート

https://www.sigbus.info/compilerbook

## ステップ 14

### call を呼ぶ前に 16 byte-aligned にする必要がある

https://www.sigbus.info/compilerbook#%E3%82%B9%E3%83%86%E3%83%83%E3%83%9714-%E9%96%A2%E6%95%B0%E3%81%AE%E5%91%BC%E3%81%B3%E5%87%BA%E3%81%97%E3%81%AB%E5%AF%BE%E5%BF%9C%E3%81%99%E3%82%8B

> x86-64 の関数呼び出しの ABI は（上のようなやり方をしている限りは）簡単ですが、注意点が一つあります。関数呼び出しをする前に RSP が 16 の倍数になっていなければいけません。push や pop は RSP を 8 バイト単位で変更するので、call 命令を発行するときに必ずしも RSP が 16 の倍数になっているとは限りません。この約束が守られていない場合、RSP が 16 の倍数になっていることを前提にしている関数が、半分の確率で落ちる謎の現象に悩まされることに m なります。関数を呼ぶ前に RSP を調整するようにして、RSP を 16 の倍数になるように調整するようにしましょう。

リファレンス実装の該当のコードは以下

https://github.com/rui314/chibicc/commit/aedbf56c3af4914e3f183223ff879734683bec73

```c
    // We need to align RSP to a 16 byte boundary before
    // calling a function because it is an ABI requirement.
    // RAX is set to 0 for variadic function.
    int seq = labelseq++;
    printf("  mov rax, rsp\n");
    printf("  and rax, 15\n");
    printf("  jnz .Lcall%d\n", seq);
    printf("  mov rax, 0\n");
    printf("  call %s\n", node->funcname);
    printf("  jmp .Lend%d\n", seq);
    printf(".Lcall%d:\n", seq);
    printf("  sub rsp, 8\n");
    printf("  mov rax, 0\n");
    printf("  call %s\n", node->funcname);
    printf("  add rsp, 8\n");
    printf(".Lend%d:\n", seq);
    printf("  push rax\n");
```

[データ構造アライメント - Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%87%E3%83%BC%E3%82%BF%E6%A7%8B%E9%80%A0%E3%82%A2%E3%83%A9%E3%82%A4%E3%83%A1%E3%83%B3%E3%83%88)
[メモリアドレス - Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%A1%E3%83%A2%E3%83%AA%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9)
[バイトマシン - Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%90%E3%82%A4%E3%83%88%E3%83%9E%E3%82%B7%E3%83%B3)

> メモリアドレス a は、a が n バイトの倍数（n は 2 の累乗）であるときに、「n バイトアライメント」と呼ばれる。

rsp が指すメモリアドレスが 16 バイトの倍数である必要がある。

アドレス付けは基本 1 バイト単位である。なので、rsp の 2 進数下 4 桁が 0 の場合は 16 バイトアラインメントである。

```c
    // rsp を rax に移動
    printf("  mov rax, rsp\n");
    // rax と 15 (0b001111) を and 演算して、0 の場合は 16 バイトアラインメント
    printf("  and rax, 15\n");
    // 16バイトアラインメントではない場合 (jnz: Jump if Not Zero) .Lcall へ
    printf("  jnz .Lcall%d\n", seq);

    // 16バイトアラインメントの場合
    // 関数を呼び出す
    printf("  mov rax, 0\n");
    printf("  call %s\n", node->funcname);
    // .Lend へ
    printf("  jmp .Lend%d\n", seq);

    // 16バイトアラインメントではない場合
    printf(".Lcall%d:\n", seq);
    // rsp から8バイト引く
    // pushやpopは8バイト単位で変更するので8バイトでok
    printf("  sub rsp, 8\n");
    printf("  mov rax, 0\n");
    // 関数を呼び出す
    printf("  call %s\n", node->funcname);
    // rsp に8バイト足して元の位置に戻す
    printf("  add rsp, 8\n");
```

cf.

- [x86-64 機械語入門](https://zenn.dev/mod_poppo/articles/x86-64-machine-code#add%E5%91%BD%E4%BB%A4)
