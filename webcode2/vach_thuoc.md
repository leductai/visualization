# Vạch thước

Cho một thước đo dài \(L\) đơn vị, được chia thành các khoảng đơn vị bởi các vạch chia tại vị trí \(0, 1, 2, \dots, L\). Ban đầu thước chỉ có các vạch ở hai đầu và ở mỗi đơn vị, tất cả đều ngắn như nhau. Người ta muốn vẽ thêm các vạch chia trung gian để thước dễ đọc hơn: vạch càng nằm ở vị trí "quan trọng" thì càng dài.

Cách vẽ được quy định như sau. Trước hết vẽ một vạch dài \(h\) tại chính giữa thước. Vạch này chia thước thành hai nửa. Trong mỗi nửa, lại vẽ một vạch dài \(h - 1\) tại chính giữa nửa đó, rồi tiếp tục chia đôi và vẽ với độ dài giảm dần cho tới khi hết độ dài cần vẽ hoặc đoạn còn lại không còn chỗ để chia.

Hãy xác định vị trí và độ dài của tất cả các vạch được vẽ thêm.

## Input

- Một dòng duy nhất gồm hai số nguyên \(L\) và \(h\) lần lượt là độ dài của thước và độ dài của vạch đầu tiên.

## Output

- Mỗi dòng in ra một vạch theo định dạng \(i:d\), trong đó \(i\) là vị trí của vạch và \(d\) là độ dài của vạch đó.
- Các vạch được in theo thứ tự vị trí tăng dần.
- Nếu không có vạch nào được vẽ thêm thì không in gì cả.

## Ràng buộc

- \(1 \le L \le 64\)
- \(0 \le h \le 10\)

## Ví dụ

### Input
```text
8 3
```

### Output
```text
1:1
2:2
3:1
4:3
5:1
6:2
7:1
```

### Giải thích
Thước dài 8, vạch đầu tiên dài 3. Trước tiên vẽ vạch dài 3 tại vị trí giữa \(m = 4\). Hai nửa là \([0,4]\) và \([4,8]\), mỗi nửa vẽ vạch dài 2 tại vị trí giữa của nó: vị trí 2 và vị trí 6. Bốn đoạn còn lại tiếp tục vẽ vạch dài 1 tại vị trí giữa: 1, 3, 5 và 7. Đến đây độ dài giảm về 0 nên dừng lại. Hai đầu thước tại vị trí 0 và 8 không được tính là vạch vẽ thêm.
