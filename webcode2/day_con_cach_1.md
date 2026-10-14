# DÃY CON CÁCH 1 DÀI NHẤT

Cho một dãy các số nguyên \(a\) gồm \(n\) phần tử, tìm một dãy con dài nhất của \(a\) thỏa điều kiện "hai phần tử liền kề chênh nhau một đơn vị" (tức \(|x - y| = 1\) với mọi cặp kề nhau trong dãy con). Dùng quy hoạch động: \(dp[i]\) là độ dài dãy con dài nhất kết thúc tại \(a[i]\), nối thêm \(a[i]\) sau mọi \(a[j]\) (\(j < i\)) có hiệu đúng bằng 1.

## Input:

* Dòng đầu tiên chứa số nguyên \(n\).
* Dòng thứ hai chứa \(n\) số nguyên là các phần tử của dãy.

## Output:

* Dòng đầu tiên in ra độ dài của dãy con tìm được.
* Dòng thứ hai in ra một dãy con dài nhất (nếu nhiều, in một dãy bất kì).

## Example:

| Input | Output |
| :--- | :--- |
| 7<br>9 8 3 4 3 7 5 | 3<br>3 4 3 |
