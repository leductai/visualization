#include <iostream>
#include <algorithm>
using namespace std;

struct DuAn {
    long long batDau;
    long long ketThuc;
    long long tinChi;
};

DuAn dsDuAn[200005];
long long tongTinChi[200005];

bool soSanh(DuAn a, DuAn b) {
    return a.ketThuc < b.ketThuc;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int soDuAn;
    cin >> soDuAn;

    for (int i = 0; i < soDuAn; i++) {
        cin >> dsDuAn[i].batDau >> dsDuAn[i].ketThuc >> dsDuAn[i].tinChi;
    }

    sort(dsDuAn, dsDuAn + soDuAn, soSanh);

    tongTinChi[0] = dsDuAn[0].tinChi;

    for (int i = 1; i < soDuAn; i++) {
        tongTinChi[i] = dsDuAn[i].tinChi;

        int trai = 0, phai = i - 1, viTri = -1;
        while (trai <= phai) {
            int giua = (trai + phai) / 2;
            if (dsDuAn[giua].ketThuc < dsDuAn[i].batDau) {
                viTri = giua;
                trai = giua + 1;
            } else {
                phai = giua - 1;
            }
        }

        if (viTri >= 0) {
            if (tongTinChi[viTri] + dsDuAn[i].tinChi > tongTinChi[i]) {
                tongTinChi[i] = tongTinChi[viTri] + dsDuAn[i].tinChi;
            }
        }

        if (tongTinChi[i-1] > tongTinChi[i]) {
            tongTinChi[i] = tongTinChi[i-1];
        }
    }

    cout << tongTinChi[soDuAn - 1] << '\n';

    return 0;
}