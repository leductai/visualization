#include <iostream>
#include <string>
using namespace std;

int soBuocSua[2][5005];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string chuoi1, chuoi2;
    cin >> chuoi1 >> chuoi2;

    int doDai1 = chuoi1.length();
    int doDai2 = chuoi2.length();

    for (int j = 0; j <= doDai2; j++) {
        soBuocSua[0][j] = j;
    }

    for (int i = 1; i <= doDai1; i++) {
        soBuocSua[i & 1][0] = i;
        for (int j = 1; j <= doDai2; j++) {
            if (chuoi1[i-1] == chuoi2[j-1]) {
                soBuocSua[i & 1][j] = soBuocSua[(i-1) & 1][j-1];
            } else {
                soBuocSua[i & 1][j] = soBuocSua[(i-1) & 1][j-1] + 1;
                if (soBuocSua[(i-1) & 1][j] + 1 < soBuocSua[i & 1][j]) {
                    soBuocSua[i & 1][j] = soBuocSua[(i-1) & 1][j] + 1;
                }
                if (soBuocSua[i & 1][j-1] + 1 < soBuocSua[i & 1][j]) {
                    soBuocSua[i & 1][j] = soBuocSua[i & 1][j-1] + 1;
                }
            }
        }
    }

    cout << soBuocSua[doDai1 & 1][doDai2] << '\n';

    return 0;
}