#include <iostream>
using namespace std;

int n;
int heSo[10];
int diem[10]; // Lưu điểm theo đơn vị 0.25: 1 = 0.25, 40 = 10.
int tongNhoNhat[11];
int tongLonNhat[11];
int diemMucTieu; // Điểm mục tiêu nhân 10.

// In điểm đang được lưu theo đơn vị 0.25.
void inDiem(int diemNhoNhat) {
    int phanNguyen = diemNhoNhat / 4;
    int phanDu = diemNhoNhat % 4;

    cout << phanNguyen;
    if (phanDu == 1) cout << ".25";
    if (phanDu == 2) cout << ".5";
    if (phanDu == 3) cout << ".75";
}

void inKetQua() {
    for (int i = 0; i < n; i++) {
        if (i > 0) cout << ' ';
        inDiem(diem[i]);
    }
    cout << '\n';
}

void quayLui(int viTri, int tong) {
    // Điểm mục tiêu sau khi làm tròn đến 0.1 tương ứng với một khoảng tổng.
    int tongThapNhat = diemMucTieu * 40 - 20;
    int tongCaoNhat = diemMucTieu * 40 + 19;

    // Nếu tổng nhỏ nhất/lớn nhất có thể của nhánh không giao với khoảng cần tìm,
    // không cần thử tiếp các điểm bên dưới nhánh này.
    if (tong + tongNhoNhat[viTri] > tongCaoNhat ||
        tong + tongLonNhat[viTri] < tongThapNhat) {
        return;
    }

    if (viTri == n) {
        if (tong >= tongThapNhat && tong <= tongCaoNhat) {
            inKetQua();
        }
        return;
    }

    // Mỗi cột nhận điểm từ 0.25 đến 10, bước nhảy 0.25.
    for (int diemThu = 1; diemThu <= 40; diemThu++) {
        diem[viTri] = diemThu;
        quayLui(viTri + 1, tong + heSo[viTri] * diemThu);
    }
}

int main() {
    cin >> n;

    for (int i = 0; i < n; i++) {
        cin >> heSo[i];
    }

    double diemThuc;
    cin >> diemThuc;
    diemMucTieu = (int)(diemThuc * 10 + 0.5);

    // Tính trước tổng nhỏ nhất và lớn nhất có thể từ mỗi vị trí trở đi.
    tongNhoNhat[n] = 0;
    tongLonNhat[n] = 0;
    for (int i = n - 1; i >= 0; i--) {
        tongNhoNhat[i] = tongNhoNhat[i + 1] + heSo[i] * 1;
        tongLonNhat[i] = tongLonNhat[i + 1] + heSo[i] * 40;
    }

    quayLui(0, 0);

    return 0;
}
