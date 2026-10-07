#include <iostream>
#include <algorithm>
using namespace std;

long long daySo[200005];
long long mangSapXep[200005];
int cayFenwick[200005];
int soMuc;

int timMax(int viTri) {
    int ketQua = 0;
    while (viTri > 0) {
        if (cayFenwick[viTri] > ketQua) {
            ketQua = cayFenwick[viTri];
        }
        viTri -= viTri & -viTri;
    }
    return ketQua;
}

void capNhat(int viTri, int giaTri) {
    while (viTri <= soMuc) {
        if (giaTri > cayFenwick[viTri]) {
            cayFenwick[viTri] = giaTri;
        }
        viTri += viTri & -viTri;
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int soPhanTu;
    cin >> soPhanTu;

    for (int i = 1; i <= soPhanTu; i++) {
        cin >> daySo[i];
        mangSapXep[i] = daySo[i];
    }

    sort(mangSapXep + 1, mangSapXep + soPhanTu + 1);

    soMuc = 1;
    for (int i = 2; i <= soPhanTu; i++) {
        if (mangSapXep[i] != mangSapXep[soMuc]) {
            soMuc++;
            mangSapXep[soMuc] = mangSapXep[i];
        }
    }

    int doDaiLonNhat = 0;
    for (int i = 1; i <= soPhanTu; i++) {
        int viTri = lower_bound(mangSapXep + 1, mangSapXep + soMuc + 1, daySo[i]) - mangSapXep;
        int doDai = timMax(viTri - 1) + 1;
        capNhat(viTri, doDai);
        if (doDai > doDaiLonNhat) {
            doDaiLonNhat = doDai;
        }
    }

    cout << doDaiLonNhat << '\n';

    return 0;
}