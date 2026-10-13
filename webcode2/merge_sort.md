# SẮP XẾP TRỘN (TOP-DOWN MERGE SORT)

Cho dãy số nguyên \(a\) gồm \(n\) phần tử. Áp dụng thuật toán Top-Down Merge Sort (theo mã giả cho sẵn) để sắp xếp dãy số theo thứ tự tăng dần.

Nếu phép \(Merge(a, left, mid, right)\) làm thay đổi dãy so với cấu hình ngay trước đó thì ghi lại cấu hình mới, tức in mảng hiện hành với đủ \(n\) phần tử. Chỉ ghi các lần Merge làm thay đổi dãy; không ghi các lần Merge không làm thay đổi dãy.

## Mã giả:

```
void MergeSort(int a[], int left, int right)
{
    if( left < right ) // điều kiện dừng của đệ quy
    {
        mid = (left + right)/2; // phép chia lấy nguyên

        MergeSort (a, mid+1, right); // cẩn thận: nửa PHẢI trước
        MergeSort (a, left, mid);
        // Trộn 2 mảng có thứ tự a[left ... mid] và a[mid+1 ... right]
        Merge(a, left, mid, right);
    }
}
```

## Input:

* Dòng đầu tiên chứa số nguyên \(n\) (\(1 \le n \le 500\)).
* Dòng thứ hai chứa \(n\) số nguyên là các phần tử của dãy.

## Output:

Mỗi dòng là một cấu hình dãy sau một lần Merge làm thay đổi dãy (chỉ các cấu hình đổi mới ghi).

## Example:

| Input | Output |
| :--- | :--- |
| 8<br>8 3 4 5 9 1 12 7 | 8 3 4 5 9 1 7 12<br>8 3 4 5 1 9 7 12<br>8 3 4 5 1 7 9 12<br>3 8 4 5 1 7 9 12<br>3 4 5 8 1 7 9 12<br>1 3 4 5 7 8 9 12 |
