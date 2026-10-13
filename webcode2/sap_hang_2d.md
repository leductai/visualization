# VÍ DỤ 4: TÌM HẠNG TRONG KHÔNG GIAN 2D

Bài toán "Sắp hạng trong không gian 2 chiều" được mô tả như sau: cho 2 điểm \(A(a_1, a_2)\) và \(B(b_1, b_2)\), \(A\) được gọi là "trội hơn" \(B\) nếu \(a_1 > b_1\) và \(a_2 > b_2\). Cho tập \(S\) có \(n\) điểm trong không gian 2 chiều, hạng của điểm \(X\) là số lượng các điểm mà \(X\) trội hơn. Hãy sắp hạng các điểm trong tập \(S\).

Mô phỏng giải bằng chia để trị (CDQ): sắp điểm theo \(x\) tăng dần rồi chia đôi; mỗi lần trộn quét hai nửa theo \(y\) tăng dần, dùng cây Fenwick đếm các điểm nửa trái có \(x\) nhỏ hơn thật và \(y\) nhỏ hơn (chính là các điểm bị trội hơn).

## Input:

* Dòng đầu tiên chứa số nguyên \(n\) (\(1 \le n \le 200\)).
* \(n\) dòng tiếp theo, mỗi dòng chứa một nhãn điểm và hai số nguyên là tọa độ \(x, y\).

## Output:

Mỗi dòng là một nhãn điểm và hạng của nó.

## Example:

| Input | Output |
| :--- | :--- |
| 5<br>A 1 1<br>B 2 3<br>C 3 2<br>D 4 4<br>E 5 0 | A 0<br>B 1<br>C 1<br>D 3<br>E 0 |
