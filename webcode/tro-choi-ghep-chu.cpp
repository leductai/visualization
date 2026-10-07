#include <iostream>
#include <string>
#include <vector>
using namespace std;

string tu;
vector<string> oChu;
vector<vector<bool>> daDung;
int soDong;
int soCot;

bool quayLui(int dong, int cot, int viTri) {
    if (viTri == tu.length()) {
        return true;
    }

    if (dong < 0 || dong >= soDong ||
        cot < 0 || cot >= soCot) {
        return false;
    }

    if (daDung[dong][cot] || oChu[dong][cot] != tu[viTri]) {
        return false;
    }

    daDung[dong][cot] = true;

    for (int doiDong = -1; doiDong <= 1; doiDong++) {
        for (int doiCot = -1; doiCot <= 1; doiCot++) {
            if (doiDong == 0 && doiCot == 0) {
                continue;
            }

            if (quayLui(dong + doiDong,
                        cot + doiCot,
                        viTri + 1)) {
                return true;
            }
        }
    }

    daDung[dong][cot] = false;
    return false;
}

int main() {
    cin >> tu;

    string dong;
    while (cin >> dong) {
        if (dong == ".") {
            break;
        }
        oChu.push_back(dong);
    }

    if (oChu.empty() || tu.empty()) {
        cout << "false";
        return 0;
    }

    soDong = oChu.size();
    soCot = oChu[0].length();
    daDung.assign(soDong, vector<bool>(soCot, false));

    bool timThay = false;

    for (int i = 0; i < soDong && !timThay; i++) {
        for (int j = 0; j < soCot && !timThay; j++) {
            if (quayLui(i, j, 0)) {
                timThay = true;
            }
        }
    }

    if (timThay) {
        cout << "true";
    } else {
        cout << "false";
    }

    return 0;
}
