#include <iostream>
using namespace std;

int n, m;
int a[45][45];
int b[45][45];
bool timThay = false;

void inKetQua() {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            cout << b[i][j] << ' ';
        }
        cout << '\n';
    }
}

bool kiemTraHangCuoi() {
    for (int cot = 0; cot < m; cot++) {
        int tong = 0;

        if (n >= 2) {
            tong += b[n - 2][cot];
        }

        if (cot > 0) {
            tong += b[n - 1][cot - 1];
        }

        if (cot + 1 < m) {
            tong += b[n - 1][cot + 1];
        }

        if (tong != a[n - 1][cot]) {
            return false;
        }
    }

    return true;
}

bool taoHangTiepTheo(int dong) {
    for (int cot = 0; cot < m; cot++) {
        int giaTri = a[dong - 1][cot];
        giaTri -= b[dong - 2][cot];

        if (cot > 0) {
            giaTri -= b[dong - 1][cot - 1];
        }

        if (cot + 1 < m) {
            giaTri -= b[dong - 1][cot + 1];
        }

        if (giaTri != 0 && giaTri != 1) {
            return false;
        }

        b[dong][cot] = giaTri;
    }

    return true;
}

void thuHangDau(int cot) {
    if (timThay) {
        return;
    }

    if (cot == m) {
        if (n == 1) {
            for (int j = 0; j < m; j++) {
                int tong = 0;

                if (j > 0) {
                    tong += b[0][j - 1];
                }

                if (j + 1 < m) {
                    tong += b[0][j + 1];
                }

                if (tong != a[0][j]) {
                    return;
                }
            }
        } else {
            if (!taoHangTiepTheo(1)) {
                return;
            }

            for (int dong = 2; dong < n; dong++) {
                if (!taoHangTiepTheo(dong)) {
                    return;
                }
            }

            if (!kiemTraHangCuoi()) {
                return;
            }
        }

        inKetQua();
        timThay = true;
        return;
    }

    for (int giaTri = 0; giaTri <= 1; giaTri++) {
        b[0][cot] = giaTri;
        thuHangDau(cot + 1);
    }
}

int main() {
    cin >> n >> m;

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            cin >> a[i][j];
        }
    }

    thuHangDau(0);
    return 0;
}
