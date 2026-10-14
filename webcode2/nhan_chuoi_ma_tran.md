# VÍ DỤ 4: NHÂN CHUỖI MA TRẬN (MATRIX CHAIN MULTIPLICATION)

## Input:

Cho 1 chuỗi ma trận \(<A_1, A_2, \dots, A_n>\), với \(A_i\) có kích thước là \(p_{i-1} \times p_i\).

## Output:

Muốn tính tích của \(A = A_1 \times A_2 \times \dots \times A_n\). Yêu cầu: xác định thứ tự nhân các ma trận sao cho số phép nhân được sử dụng là ít nhất.

Mô phỏng giải bằng quy hoạch động trên đoạn: \(dp[i][j]\) là số phép nhân ít nhất để nhân đoạn \(A_i \dots A_j\), thử mọi điểm cắt \(k\) với phí nhân \(p_{i-1} \cdot p_k \cdot p_j\) rồi truy vết bảng cắt.

## Dữ liệu:

* Một dòng duy nhất là dãy kích thước \(p_0, p_1, \dots, p_n\) (2..13 số nguyên dương, tức 1..12 ma trận).

## Kết quả:

* Dòng đầu là số phép nhân ít nhất.
* Dòng sau là thứ tự nhân tối ưu với đầy đủ dấu ngoặc.

## Example:

| Input | Output |
| :--- | :--- |
| 30 35 15 5 10 20 25 | 15125<br>((A1 x (A2 x A3)) x ((A4 x A5) x A6)) |
