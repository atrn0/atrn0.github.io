# 『低レイヤを知りたい人のための C コンパイラ作成入門』勉強ノート

[低レイヤを知りたい人のための C コンパイラ作成入門](https://www.sigbus.info/compilerbook)

## ステップ 14

[低レイヤを知りたい人のための C コンパイラ作成入門 - ステップ 14: 関数の呼び出しに対応する](https://www.sigbus.info/compilerbook#%E3%82%B9%E3%83%86%E3%83%83%E3%83%9714-%E9%96%A2%E6%95%B0%E3%81%AE%E5%91%BC%E3%81%B3%E5%87%BA%E3%81%97%E3%81%AB%E5%AF%BE%E5%BF%9C%E3%81%99%E3%82%8B)

### call を呼ぶ前に 16 byte-aligned にする必要がある

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

## ステップ 15

- [低レイヤを知りたい人のための C コンパイラ作成入門 - ステップ 15: 関数の定義に対応する](https://www.sigbus.info/compilerbook#%E3%82%B9%E3%83%86%E3%83%83%E3%83%9715-%E9%96%A2%E6%95%B0%E3%81%AE%E5%AE%9A%E7%BE%A9%E3%81%AB%E5%AF%BE%E5%BF%9C%E3%81%99%E3%82%8B)
- 該当コミット:
  - https://github.com/rui314/chibicc/commit/004b0fd8d230352fda871fe5badd80ff92c4068c

この段階のリファレンス実装の出力はこんな感じ。

```sh
$ ./chibicc "main() { 0; }"
.intel_syntax noprefix
.global main
main:
  push rbp
  mov rbp, rsp
  sub rsp, 0
  push 0
  add rsp, 8
.Lreturn.main:
  mov rsp, rbp
  pop rbp
  ret
```

手元の Rust 実装がうまく動かなくなってしまったのでデバッグする。
手元の出力はこんな感じ。

```
$ docker compose run joe cargo run "main() { 0; }"
   Compiling joe v0.1.0 (/home/user/joe)
    Finished dev [unoptimized + debuginfo] target(s) in 3.31s
     Running `target/debug/joe 'main() { 0; }'`
.global main
main:
  push rbp
  mov rbp, rsp
  sub rsp, 0
  push 0
.Lreturn.main:
  mov rsp, rbp
  pop rbp
  ret
```

`.intel_syntax noprefix` が足りていない。これは Intel 記法を使用することを指すディレクティブ。

AT&T 記法との主な差:

- オペランドの順番がディスティネーション、ソースの順番になる (AT&T はソース、ディスティネントの順)
- レジスタ名はそのまま使用する (AT&T は%プレフィックス)
- メモリアクセスに[]を使う (AT&T は())
- 即値には$プレフィックスを付けない (AT&T は付ける)

cf. [ステップ 1：整数 1 個をコンパイルする言語の作成](https://www.sigbus.info/compilerbook#%E3%82%B9%E3%83%86%E3%83%83%E3%83%971%E6%95%B4%E6%95%B01%E5%80%8B%E3%82%92%E3%82%B3%E3%83%B3%E3%83%91%E3%82%A4%E3%83%AB%E3%81%99%E3%82%8B%E8%A8%80%E8%AA%9E%E3%81%AE%E4%BD%9C%E6%88%90)

`main() { a=3; z=5; return a+z; } => 8 expected, but got 10`

<details>
<summary>expected</summary>

```
$ ./chibicc "main() { a=3; z=5; return a+z; }"
.intel_syntax noprefix
.global main
main:
  push rbp
  mov rbp, rsp
  sub rsp, 16
  lea rax, [rbp-16]
  push rax
  push 3
  pop rdi
  pop rax
  mov [rax], rdi
  push rdi
  add rsp, 8
  lea rax, [rbp-8]
  push rax
  push 5
  pop rdi
  pop rax
  mov [rax], rdi
  push rdi
  add rsp, 8
  lea rax, [rbp-16]
  push rax
  pop rax
  mov rax, [rax]
  push rax
  lea rax, [rbp-8]
  push rax
  pop rax
  mov rax, [rax]
  push rax
  pop rdi
  pop rax
  add rax, rdi
  push rax
  pop rax
  jmp .Lreturn.main
.Lreturn.main:
  mov rsp, rbp
  pop rbp
  ret
```

</details>

<details>
<summary>actual</summary>

```
docker compose run joe cargo run "main() { a=3; z=5; return a+z; }"
   Compiling joe v0.1.0 (/home/user/joe)
    Finished dev [unoptimized + debuginfo] target(s) in 2.08s
     Running `target/debug/joe 'main() { a=3; z=5; return a+z; }'`
.intel_syntax noprefix
.global main
main:
  push rbp
  mov rbp, rsp
  sub rsp, 16
  mov rax, rbp
  sub rax, 0
  push rax
  push 3
  pop rdi
  pop rax
  mov [rax], rdi
  push rdi
  mov rax, rbp
  sub rax, 0
  push rax
  push 5
  pop rdi
  pop rax
  mov [rax], rdi
  push rdi
  mov rax, rbp
  sub rax, 0
  push rax
  pop rax
  mov rax, [rax]
  push rax
  mov rax, rbp
  sub rax, 0
  push rax
  pop rax
  mov rax, [rax]
  push rax
  pop rdi
  pop rax
  add rax, rdi
  push rax
  pop rax
  jmp .Lreturn.main
.Lreturn.main:
  mov rsp, rbp
  pop rbp
  ret
```

</details>

TODO: ローカル変数の扱い
