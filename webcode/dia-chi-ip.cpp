#include <iostream>
#include <string>
using namespace std;

string s;
string phan[4];
int doDai;

void inDiaChi() {
    for (int i = 0; i < 4; i++) {
        if (i > 0) cout << '.';
        cout << phan[i];
    }
    cout << '\n';
}

void quayLui(int viTri, int soPhan) {
    if (soPhan == 4) {
        if (viTri == doDai) inDiaChi();
        return;
    }

    int soPhanConLai = 4 - soPhan;
    int soKyTuConLai = doDai - viTri;

    if (soKyTuConLai < soPhanConLai ||
        soKyTuConLai > soPhanConLai * 3) {
        return;
    }

    int giaTri = 0;

    for (int soKyTu = 1;
         soKyTu <= 3 && viTri + soKyTu <= doDai;
         soKyTu++) {
        if (soKyTu > 1 && s[viTri] == '0') break;

        giaTri = giaTri * 10 + (s[viTri + soKyTu - 1] - '0');
        if (giaTri > 255) break;

        phan[soPhan] = s.substr(viTri, soKyTu);
        quayLui(viTri + soKyTu, soPhan + 1);
    }
}

int main() {
    cin >> s;
    doDai = s.length();
    quayLui(0, 0);
    return 0;
}
