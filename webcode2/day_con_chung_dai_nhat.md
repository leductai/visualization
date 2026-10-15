# Dãy con chung dài nhất

Cho hai chuỗi ký tự \(X\) và \(Y\). Một dãy con của một chuỗi là chuỗi thu được bằng cách xóa đi một số ký tự (có thể không xóa ký tự nào), giữ nguyên thứ tự của các ký tự còn lại. Một dãy con chung của \(X\) và \(Y\) là chuỗi vừa là dãy con của \(X\), vừa là dãy con của \(Y\).

Hãy tìm dãy con chung có độ dài lớn nhất của hai chuỗi đã cho. Nếu có nhiều dãy con chung cùng độ dài lớn nhất, in ra một dãy bất kỳ.

Yêu cầu: dùng kỹ thuật quy hoạch động.

## Input

- Dòng đầu tiên là chuỗi \(X\).
- Dòng thứ hai là chuỗi \(Y\).
- Mỗi chuỗi là một dãy ký tự không chứa dấu cách.

## Output

- Dòng đầu tiên in ra độ dài của dãy con chung dài nhất.
- Dòng thứ hai in ra dãy con chung dài nhất tìm được. Nếu hai chuỗi không có ký tự nào chung, dòng thứ hai để trống.

## Ràng buộc

- \(0 \le |X|, |Y| \le 30\)
- Các chuỗi chỉ gồm chữ cái và chữ số, không chứa dấu cách.

## Ví dụ

### Input
```text
abcbadt
cbkadt
```

### Output
```text
5
cbadt
```

### Giải thích
Dãy `cbadt` có độ dài 5. Trong chuỗi \(X\) = `abcbadt`, các ký tự `c`, `b`, `a`, `d`, `t` lần lượt xuất hiện ở vị trí 3, 4, 5, 6, 7, giữ nguyên thứ tự. Trong chuỗi \(Y\) = `cbkadt`, các ký tự này xuất hiện ở vị trí 1, 2, 4, 5, 6, cũng giữ nguyên thứ tự. Không có dãy con chung nào dài hơn 5.
