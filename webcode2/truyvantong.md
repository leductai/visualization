# TRUY VẤN TỔNG

Cho một mảng $A$ chứa $n$ phần tử và $q$ cặp số $a, b$. Tính tổng các giá trị của mảng $A$ có thứ tự nằm trong khoảng $[a, b]$. Thứ tự bắt đầu đếm từ 1, $A[0]$ là phần tử thứ 1.

## Input:
* Dòng đầu tiên chứa hai số nguyên $n$ và $q$ ($1 \le n, q \le 2 \cdot 10^5$).
* Dòng thứ hai chứa $n$ số nguyên là các phần tử trong mảng ($1 \le x_i \le 10^9, i \in [1 \dots n]$).
* Cuối cùng, có $q$ dòng, mỗi dòng có hai số nguyên $a$ và $b$ ($1 \le a \le b \le n$).

## Output:
Kết quả tính tổng của mỗi truy vấn trong mỗi dòng $q$.

## Example:

| Input | Output |
| :--- | :--- |
| 8 4<br>3 2 4 5 1 1 5 3<br>2 4<br>5 6<br>1 8<br>3 3 | 11<br>2<br>24<br>4 |