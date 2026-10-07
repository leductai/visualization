#include <iostream>
using namespace std;

int n;
int hoanVi[10];
bool daDung[10];

// In ra hoán vị khi cả n vị trí đã được điền.
void inHoanVi() {
    for (int i = 0; i < n; i++) {
        if (i > 0) cout << ' ';
        cout << hoanVi[i];
    }
    cout << '\n';
}

// Ở mỗi vị trí, thử lần lượt các số chưa được sử dụng.
void quayLui(int viTri) {
    if (viTri == n) {
        inHoanVi();
        return;
    }

    for (int so = 1; so <= n; so++) {
        if (!daDung[so]) {
            hoanVi[viTri] = so;
            daDung[so] = true;
            quayLui(viTri + 1);
            // Hoàn tác để thử số khác ở vị trí này.
            daDung[so] = false;
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    quayLui(0);
    return 0;
}
