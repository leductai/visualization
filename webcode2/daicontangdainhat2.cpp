#include <iostream>
using namespace std;

long long daySo[200005];
long long giaTriCuoi[200005];
int viTriCuoi[200005];
int phanTuTruoc[200005];
int dayKetQua[200005];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int soPhanTu;
    cin >> soPhanTu;

    for (int i = 1; i <= soPhanTu; i++) {
        cin >> daySo[i];
    }

    int doDaiLonNhat = 0;

    for (int i = 1; i <= soPhanTu; i++) {
        int trai = 1, phai = doDaiLonNhat, viTri = 0;
        while (trai <= phai) {
            int giua = (trai + phai) / 2;
            if (giaTriCuoi[giua] < daySo[i]) {
                viTri = giua;
                trai = giua + 1;
            } else {
                phai = giua - 1;
            }
        }

        if (viTri == 0) {
            phanTuTruoc[i] = 0;
        } else {
            phanTuTruoc[i] = viTriCuoi[viTri];
        }

        if (viTri == doDaiLonNhat) {
            doDaiLonNhat = viTri + 1;
            giaTriCuoi[viTri + 1] = daySo[i];
            viTriCuoi[viTri + 1] = i;
        } else if (daySo[i] < giaTriCuoi[viTri + 1]) {
            giaTriCuoi[viTri + 1] = daySo[i];
            viTriCuoi[viTri + 1] = i;
        }
    }

    int soKetQua = 0;
    int chiSoHienTai = viTriCuoi[doDaiLonNhat];
    while (chiSoHienTai != 0) {
        dayKetQua[soKetQua++] = daySo[chiSoHienTai];
        chiSoHienTai = phanTuTruoc[chiSoHienTai];
    }

    cout << doDaiLonNhat << '\n';
    for (int i = soKetQua - 1; i >= 0; i--) {
        cout << dayKetQua[i];
        if (i > 0) cout << ' ';
    }
    cout << '\n';

    return 0;
}