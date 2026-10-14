# VÍ DỤ 4: CHỌN HOẠT ĐỘNG (ACTIVITY-SELECTION / INTERVAL SCHEDULING)

* Cho một tập các hoạt động \(S = \{1, 2, \dots, n\}\).
* Một hoạt động \(i\) có thời điểm bắt đầu là \(s_i\) và thời điểm chấm dứt là \(f_i\), \(s_i < f_i\).
* Nếu hoạt động \(i\) được chọn thì \(i\) tiến hành trong thời gian \([s_i, f_i)\) (nửa mở: chạm biên vẫn tương thích).

Giải bằng tham lam: sắp các hoạt động theo giờ kết thúc tăng dần, duyệt và chọn hoạt động nào bắt đầu không sớm hơn giờ kết thúc đã chọn (\(s_i \ge f_{cuối}\)). Khác với bài Đồ án (quy hoạch động, tương thích nghiêm ngặt \(end < start\), có trọng số), ở đây mọi hoạt động giá trị như nhau nên tham lam cho đáp án tối ưu.

## Input:

* Dòng đầu tiên chứa số nguyên \(n\) (\(1 \le n \le 1000\)).
* \(n\) dòng tiếp theo, mỗi dòng chứa hai số nguyên \(s_i\) \(f_i\) với \(s_i < f_i\).

## Output:

* Dòng đầu là số lượng hoạt động chọn được.
* Dòng sau là chỉ số (1-based theo input) các hoạt động được chọn theo thứ tự kết thúc.

## Example:

| Input | Output |
| :--- | :--- |
| 3<br>1 3<br>2 4<br>3 5 | 2<br>1 3 |
